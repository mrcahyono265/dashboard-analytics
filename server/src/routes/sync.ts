import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireManagerOrAbove } from '../middleware/rbac.js';
import { prisma } from '../lib/db.js';
import { getAuthUrl, exchangeCodeForTokens, MicrosoftGraphClient } from '../lib/excel365.js';
import { startSyncJob, stopSyncJob, getSyncJobStatus } from '../jobs/sync-excel365.js';

const router = Router();

// POST /api/sync/connect - Connect Microsoft 365 account
router.post('/connect', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const state = req.user!.id; // Use userId as state for security

    const authUrl = getAuthUrl(
      process.env.MS_CLIENT_ID || '',
      process.env.MS_REDIRECT_URI || `http://localhost:3001/api/sync/callback`,
      state
    );

    res.json({ authUrl });
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// GET /api/sync/callback - OAuth callback
router.get('/callback', async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state' });
      return;
    }

    const userId = state as string;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      process.env.MS_CLIENT_ID || '',
      process.env.MS_CLIENT_SECRET || '',
      code as string,
      process.env.MS_REDIRECT_URI || `http://localhost:3001/api/sync/callback`
    );

    // Store tokens (in production, encrypt these!)
    // For now, we'll store them in memory (not persistent across restarts)
    // TODO: Store encrypted tokens in database
    console.log(`[Sync] Received tokens for user ${userId}`);

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?sync=connected`);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?sync=error`);
  }
});

// POST /api/sync/start - Start syncing a file
router.post('/start', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, accessToken } = req.body;

    if (!fileId || !accessToken) {
      res.status(400).json({ error: 'fileId and accessToken are required' });
      return;
    }

    await startSyncJob(req.user!.id, fileId, accessToken);

    res.json({
      message: 'Sync started',
      fileId,
      interval: '30 seconds',
    });
  } catch (error) {
    console.error('Start sync error:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

// POST /api/sync/stop - Stop syncing
router.post('/stop', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    stopSyncJob(req.user!.id);
    res.json({ message: 'Sync stopped' });
  } catch (error) {
    console.error('Stop sync error:', error);
    res.status(500).json({ error: 'Failed to stop sync' });
  }
});

// GET /api/sync/status - Get sync status
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const jobStatus = getSyncJobStatus(req.user!.id);

    const recentSyncs = await prisma.syncLog.findMany({
      where: {
        source: 'excel365',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      active: jobStatus.active,
      fileId: jobStatus.fileId,
      recentSyncs,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sync/excel365 - Trigger manual sync (placeholder)
router.post('/excel365', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, period } = req.body;

    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    // TODO: Implement actual sync
    res.json({
      message: 'Manual sync triggered',
      fileId,
      period: period || new Date().toISOString().slice(0, 7),
      status: 'pending',
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sync/webhook - Microsoft Graph webhook endpoint (placeholder)
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    // Microsoft Graph sends a validation token on subscription creation
    const validationToken = req.query.validationToken;
    if (validationToken) {
      res.set('Content-Type', 'text/plain');
      res.send(validationToken);
      return;
    }

    // Handle change notification
    const notification = req.body;
    console.log('Received webhook notification:', notification);

    // TODO: Process the notification and trigger sync
    res.status(202).json({ message: 'Notification received' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sync/files - List Excel files from OneDrive
router.get('/files', authMiddleware, requireManagerOrAbove, async (req: AuthRequest, res: Response) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      res.status(400).json({ error: 'accessToken is required' });
      return;
    }

    const client = new MicrosoftGraphClient(accessToken as string);
    const files = await client.getRecentExcelFiles();

    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export { router as syncRoutes };
