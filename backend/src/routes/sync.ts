import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireManagerOrAbove } from '../middleware/rbac.js';
import { prisma } from '../lib/db.js';
import { getAuthUrl, exchangeCodeForTokens, MicrosoftGraphClient } from '../lib/excel365.js';
import { saveTokens, getTokens, deleteTokens } from '../lib/token-store.js';
import { startSyncJob, stopSyncJob, getSyncJobStatus, syncOnce, syncFromBuffer, generateExcelBuffer, clearAllUserData, startUrlSyncJob, stopUrlSyncJob, getUrlSyncJobStatus } from '../jobs/sync-excel365.js';
import { addSSEClient } from '../lib/sse.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// OAuth state nonce store: nonce → userId (expires in 5 min)
const oauthStates = new Map<string, string>();

// POST /api/sync/connect — generate Microsoft OAuth URL
router.post('/connect', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const nonce = crypto.randomUUID();
    oauthStates.set(nonce, req.user!.id);
    setTimeout(() => oauthStates.delete(nonce), 5 * 60 * 1000);
    const authUrl = getAuthUrl(
      process.env.MS_CLIENT_ID || '',
      process.env.MS_REDIRECT_URI || 'http://localhost:3001/api/sync/callback',
      nonce
    );
    res.json({ authUrl });
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// GET /api/sync/callback — Microsoft OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state' });
      return;
    }

    const userId = oauthStates.get(state as string);
    if (!userId) {
      res.status(400).json({ error: 'Invalid or expired OAuth state' });
      return;
    }
    oauthStates.delete(state as string);
    const tokens = await exchangeCodeForTokens(
      process.env.MS_CLIENT_ID || '',
      process.env.MS_CLIENT_SECRET || '',
      code as string,
      process.env.MS_REDIRECT_URI || 'http://localhost:3001/api/sync/callback'
    );

    await saveTokens(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });

    console.log(`[Sync] Stored tokens for user ${userId}`);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173/'}?sync=connected`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173/'}?sync=error`);
  }
});

// POST /api/sync/excel365 — one-time manual sync
router.post('/excel365', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      fileId: z.string().min(1),
      period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      fileName: z.string().optional(),
    });
    const { fileId, period, fileName } = schema.parse(req.body);

    const tokens = await getTokens(req.user!.id);
    if (!tokens) {
      res.status(401).json({ error: 'Not connected to Microsoft 365. Connect first.' });
      return;
    }

    const result = await syncOnce(req.user!.id, fileId, tokens.accessToken, period);

    // Update active source to excel365 after successful sync
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { activeSource: 'excel365', sourceFileName: fileName || null },
    });

    res.json({
      message: 'Sync completed successfully',
      recordsCount: result.recordsCount,
      sheets: result.sheets,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Sync error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
});

// POST /api/sync/start — start continuous auto-sync
router.post('/start', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    const tokens = await getTokens(req.user!.id);
    if (!tokens) {
      res.status(401).json({ error: 'Not connected to Microsoft 365' });
      return;
    }

    await startSyncJob(req.user!.id, fileId);

    // Update active source to excel365 + persist auto-sync config
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        activeSource: 'excel365',
        autoSyncEnabled: true,
        syncConfig: JSON.stringify({ type: 'onedrive', fileId }),
      },
    });

    res.json({ message: 'Auto-sync started', fileId, interval: '60 seconds' });
  } catch (error) {
    console.error('Start sync error:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

// POST /api/sync/stop — stop auto-sync (keep config for resume)
router.post('/stop', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    stopSyncJob(req.user!.id);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { autoSyncEnabled: false },
    });
    res.json({ message: 'Sync stopped' });
  } catch (error) {
    console.error('Stop sync error:', error);
    res.status(500).json({ error: 'Failed to stop sync' });
  }
});

// POST /api/sync/disconnect — fully disconnect Microsoft 365 (clear tokens + stop sync)
router.post('/disconnect', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    stopSyncJob(req.user!.id);
    await deleteTokens(req.user!.id);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { autoSyncEnabled: false, syncConfig: null },
    });
    res.json({ message: 'Disconnected from Microsoft 365' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// GET /api/sync/status — sync status + history + connected account
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const jobStatus = getSyncJobStatus(req.user!.id);
    const urlJobStatus = getUrlSyncJobStatus(req.user!.id);
    const tokens = await getTokens(req.user!.id);
    const hasToken = !!tokens;

    let account: { displayName: string; email: string } | null = null;
    if (tokens) {
      try {
        const me = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }).then(r => r.json()) as { displayName?: string; mail?: string; userPrincipalName?: string };
        account = {
          displayName: me.displayName || '',
          email: me.mail || me.userPrincipalName || '',
        };
      } catch {}
    }

    const recentSyncs = await prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      connected: hasToken,
      active: jobStatus.active,
      fileId: jobStatus.fileId,
      urlActive: urlJobStatus.active,
      url: urlJobStatus.url || null,
      account,
      recentSyncs,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sync/events — SSE stream for real-time data update notifications
// Uses token query param because EventSource API doesn't support custom headers
router.get('/events', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) { res.status(401).json({ error: 'Token required' }); return; }
    const decoded = verifyToken(token);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const ping = setInterval(() => res.write(': ping\n\n'), 30000);
    addSSEClient(decoded.id, res);

    req.on('close', () => clearInterval(ping));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/sync/files — list Excel files from OneDrive
router.get('/files', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const tokens = await getTokens(req.user!.id);
    if (!tokens) {
      res.status(401).json({ error: 'Not connected to Microsoft 365' });
      return;
    }

    const client = new MicrosoftGraphClient(tokens.accessToken);
    let files: any[] = [];
    try {
      files = await client.getRecentExcelFiles();
    } catch {
      // ponytail: tenant may lack SPO license — return empty with flag
      res.json({ files: [], limitedLicense: true });
      return;
    }

    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Convert share links (1drv.ms, Google Drive) to direct download URLs
async function resolveDownloadUrl(url: string): Promise<string> {
  // OneDrive / 1drv.ms short links → follow redirect → extract resid + authkey
  if (url.includes('1drv.ms') || url.includes('onedrive.live.com/redir')) {
    try {
      // 1drv.ms returns 302; fetch with manual redirect to capture Location header
      const head = await fetch(url, { redirect: 'manual' });
      const location = head.headers.get('location');
      if (location) {
        const parsed = new URL(location);
        const resid = parsed.searchParams.get('resid');
        const authkey = parsed.searchParams.get('authkey');
        if (resid) {
          let dl = `https://onedrive.live.com/download?resid=${encodeURIComponent(resid)}`;
          if (authkey) dl += `&authkey=${encodeURIComponent(authkey)}`;
          return dl;
        }
      }
    } catch {
      // If redirect resolution fails, fall through to try the original URL
    }
  }

  // Google Drive share links → direct download
  // drive.google.com/file/d/FILE_ID/view?... → drive.google.com/uc?export=download&id=FILE_ID
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gdriveMatch) {
    return `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;
  }

  // Google Sheets links → XLSX export (all sheets)
  // docs.google.com/spreadsheets/d/SPREADSHEET_ID → export?format=xlsx
  const gsheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/);
  if (gsheetsMatch) {
    // ponytail: export includes all sheets; gid param for specific sheet not needed
    return `https://docs.google.com/spreadsheets/d/${gsheetsMatch[1]}/export?format=xlsx`;
  }

  return url;
}

// POST /api/sync/url — download Excel from a URL and sync to DB
// preview=true: parse only, return sheet counts, no save/switch
router.post('/url', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      url: z.string().url(),
      period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      preview: z.boolean().optional().default(false),
    });
    const { url, period, preview } = schema.parse(req.body);

    // Resolve share links to direct download URLs
    const downloadUrl = await resolveDownloadUrl(url);
    console.log(`[Sync] URL resolved: ${url.slice(0, 60)}... → ${downloadUrl.slice(0, 80)}...`);

    // Download file
    const fetchResponse = await fetch(downloadUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardSync/1.0)' },
    });
    if (!fetchResponse.ok) {
      res.status(400).json({ error: `Failed to download file (HTTP ${fetchResponse.status}). Ensure the link is shared as "Anyone with link".` });
      return;
    }

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify it's actually an xlsx file (PK header = zip/xlsx)
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      res.status(400).json({
        error: 'Downloaded file is not a valid Excel file. The URL may point to a web page instead of the file. Try converting to a direct download link.',
      });
      return;
    }

    if (preview) {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      const sheets: { sheetName: string; recordsCount: number }[] = workbook.SheetNames
        .map((name: string) => {
          const ws = workbook.Sheets[name];
          const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          return { sheetName: name, recordsCount: data.length };
        })
        .filter((s: { recordsCount: number }) => s.recordsCount > 0);
      const totalRecords = sheets.reduce((sum: number, s: { recordsCount: number }) => sum + s.recordsCount, 0);

      res.json({
        message: 'URL preview completed',
        sheets,
        totalRecords,
      });
      return;
    }

    // Full sync: clear old data, save to DB, switch source
    await clearAllUserData(req.user!.id);
    const result = await syncFromBuffer(req.user!.id, buffer, 'url', period);

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { activeSource: 'url', sourceFileName: url },
    });

    await prisma.syncLog.create({
      data: { source: 'url', status: 'success', recordsCount: result.recordsCount },
    });

    res.json({
      message: 'URL sync completed',
      recordsCount: result.recordsCount,
      sheets: result.sheets,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('URL sync error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'URL sync failed' });
  }
});

// GET /api/sync/download — generate Excel from DB data and download (two-way: DB → Excel)
router.get('/download', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const buffer = await generateExcelBuffer(req.user!.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard-data.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

// POST /api/sync/url/start — start URL auto-sync polling
router.post('/url/start', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required' });
      return;
    }
    await startUrlSyncJob(req.user!.id, url);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        activeSource: 'url',
        sourceFileName: url,
        autoSyncEnabled: true,
        syncConfig: JSON.stringify({ type: 'url', url }),
      },
    });
    res.json({ message: 'URL auto-sync started', interval: '60 seconds' });
  } catch (error) {
    console.error('URL auto-sync start error:', error);
    res.status(500).json({ error: 'Failed to start auto-sync' });
  }
});

// POST /api/sync/url/stop — stop URL auto-sync (keep config for resume)
router.post('/url/stop', authMiddleware, async (req: AuthRequest, res: Response) => {
  stopUrlSyncJob(req.user!.id);
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { autoSyncEnabled: false },
  });
  res.json({ message: 'URL auto-sync stopped' });
});

// POST /api/sync/webhook — Microsoft Graph subscription validation
router.post('/webhook', async (req: Request, res: Response) => {
  const validationToken = req.query.validationToken;
  if (validationToken) {
    res.set('Content-Type', 'text/plain');
    res.send(validationToken);
    return;
  }
  res.status(202).json({ message: 'Notification received' });
});

export { router as syncRoutes };
