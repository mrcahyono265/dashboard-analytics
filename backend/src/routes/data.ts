import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { parseReport, detectReportFile } from '../lib/parser-report.js';
import { parseWorkbook } from '../lib/parsers.js';
import { clearAllUserData, syncFromBuffer } from '../jobs/sync-excel365.js';
import { getTokens } from '../lib/token-store.js';
import { MicrosoftGraphClient } from '../lib/excel365.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

async function buildDataFilter(user: any, sheetType?: string) {
  const where: any = {};
  if (sheetType) where.sheetType = sheetType;

  if (user.role === 'RSE') {
    // RSE sees all data — no uploadedBy filter
  } else {
    // SM and CRR see data from RSE uploads + their own
    const rseUsers = await prisma.user.findMany({
      where: { role: 'RSE' },
      select: { id: true }
    });
    where.uploadedBy = { in: [...rseUsers.map((u: any) => u.id), user.id] };
  }

  return where;
}

// GET /api/data/active-source
router.get('/active-source', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { activeSource: true, sourceFileName: true } });
  res.json({ activeSource: user?.activeSource || 'upload', sourceFileName: user?.sourceFileName || null });
});

// POST /api/data/switch-source — clean slate + activate from staged/url/excel365
router.post('/switch-source', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      source: z.enum(['upload', 'excel365', 'url']),
      sourceFileName: z.string().optional(),
      url: z.string().optional(),
      fileId: z.string().optional(),
    });
    const { source, sourceFileName, url, fileId } = schema.parse(req.body);

    // Read staged data BEFORE clearAllUserData (which clears stagingJson)
    let stagedData: any = null;
    if (source === 'upload') {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { stagingJson: true },
      });
      if (!user?.stagingJson) {
        res.status(400).json({ error: 'No staged data. Upload a file first.' });
        return;
      }
      stagedData = JSON.parse(user.stagingJson);
    }

    // Clean slate: delete all user data (DataRecords, non-admin users, master data, etc.)
    await clearAllUserData(req.user!.id);

    let results: { sheetType: string; recordsCount: number }[] = [];

    if (source === 'upload') {
      const { period, category, sheets } = stagedData;

      for (const sheet of sheets) {
        await prisma.dataRecord.upsert({
          where: {
            sheetType_period_uploadedBy_category: {
              sheetType: sheet.sheetType, period, uploadedBy: req.user!.id, category,
            },
          },
          update: { dataJson: JSON.stringify(sheet.records), source: 'upload' },
          create: {
            sheetType: sheet.sheetType, period, category,
            dataJson: JSON.stringify(sheet.records), uploadedBy: req.user!.id, source: 'upload',
          },
        });
        results.push({ sheetType: sheet.sheetType, recordsCount: sheet.records.length });
      }

      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          activeSource: 'upload',
          sourceFileName: sourceFileName ?? null,
          stagingJson: null,
        },
      });
    } else if (source === 'url') {
      if (!url) {
        res.status(400).json({ error: 'URL is required for url source' });
        return;
      }
      // Download + parse + save
      const resp = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardSync/1.0)' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching URL`);
      const buf = Buffer.from(await resp.arrayBuffer());
      const syncResult = await syncFromBuffer(req.user!.id, buf, 'url');
      results = syncResult.sheets.map(s => ({ sheetType: s.sheetType, recordsCount: s.count }));

      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          activeSource: 'url',
          sourceFileName: sourceFileName ?? url,
          syncConfig: JSON.stringify({ type: 'url', url }),
        },
      });
    } else if (source === 'excel365') {
      if (!fileId) {
        res.status(400).json({ error: 'fileId is required for excel365 source' });
        return;
      }
      // Download via Graph API + parse + save
      const tokens = await getTokens(req.user!.id);
      if (!tokens) {
        res.status(400).json({ error: 'Not connected to Microsoft 365' });
        return;
      }
      const client = new MicrosoftGraphClient(tokens.accessToken);
      const buf = await client.downloadFile(fileId);
      const syncResult = await syncFromBuffer(req.user!.id, buf, 'excel365');
      results = syncResult.sheets.map(s => ({ sheetType: s.sheetType, recordsCount: s.count }));

      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          activeSource: 'excel365',
          sourceFileName: sourceFileName ?? fileId,
          syncConfig: JSON.stringify({ type: 'onedrive', fileId }),
        },
      });
    }

    res.json({
      message: `Switched to ${source}. All previous data cleared.`,
      activeSource: source,
      sheets: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Switch source error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/data/periods — list available periods
router.get('/periods', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const where = await buildDataFilter(req.user!);
    const records = await prisma.dataRecord.findMany({
      where,
      select: { period: true, sheetType: true, category: true, updatedAt: true },
      orderBy: { period: 'desc' }
    });
    const periods = [...new Set(records.map(r => r.period))];
    res.json({ periods, records });
  } catch (error) {
    console.error('Get periods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/data/overview/stats
router.get('/overview/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period, category } = req.query;
    const where = await buildDataFilter(req.user!);
    if (period) where.period = period;
    if (category) where.category = category;

    const sheetTypes = ['XLC', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE'];
    const stats: any = {
      totalActivations: 0, totalRevenue: 0,
      channelBreakdown: [] as { channel: string; count: number }[],
      topStores: [] as { name: string; count: number }[],
      topRsm: [] as { name: string; count: number }[],
      period: null as string | null,
    };

    for (const sheetType of sheetTypes) {
      const record = await prisma.dataRecord.findFirst({
        where: { ...where, sheetType },
        orderBy: { createdAt: 'desc' }
      });
      if (!record) continue;
      if (!stats.period) stats.period = record.period;

      const data = JSON.parse(record.dataJson);
      if (!Array.isArray(data)) continue;

      if (sheetType === 'GSF') {
        stats.totalRevenue += data.reduce((s: number, d: any) => s + (Number(d.Amount) || 0), 0);
      } else {
        stats.totalActivations += data.length;
      }

      const storeCount = new Map<string, number>();
      const rsmCount = new Map<string, number>();
      for (const d of data) {
        const store = d.StoreName || d.Office || d.XLCName || d.ExpoName || null;
        const rsm = d.RSM || null;
        if (store) storeCount.set(store, (storeCount.get(store) || 0) + 1);
        if (rsm) rsmCount.set(rsm, (rsmCount.get(rsm) || 0) + 1);
      }

      stats.channelBreakdown.push({ channel: sheetType, count: data.length });
      stats.topStores = mergeTop(stats.topStores, Array.from(storeCount.entries()).map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count).slice(0, 5), 10);
      stats.topRsm = mergeTop(stats.topRsm, Array.from(rsmCount.entries()).map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count).slice(0, 5), 10);
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function mergeTop(existing: { name: string; count: number }[], incoming: { name: string; count: number }[], limit: number) {
  const map = new Map(existing.map((e) => [e.name, e.count]));
  for (const item of incoming) map.set(item.name, (map.get(item.name) || 0) + item.count);
  return Array.from(map.entries()).map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count).slice(0, limit);
}

// GET /api/data/:sheetType
router.get('/:sheetType', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sheetType = req.params.sheetType as string;
    const { period, category } = req.query;
    const validSheetTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor',
      'XLC_REPORT', 'GSF_REPORT', 'WO_REPORT', 'EXPO_REPORT', 'STORE_MASTER', 'RANKING'];
    if (!validSheetTypes.includes(sheetType)) {
      res.status(400).json({ error: 'Invalid sheet type' });
      return;
    }

    const where = await buildDataFilter(req.user!, sheetType);
    if (period) where.period = period;
    if (category) where.category = category;

    const record = await prisma.dataRecord.findFirst({
      where, orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      res.json({ data: [], period: null, sheetType });
      return;
    }

    res.json({
      data: JSON.parse(record.dataJson),
      period: record.period,
      category: record.category,
      source: record.source,
      uploadedAt: record.createdAt,
      sheetType: record.sheetType,
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/data
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period, category } = req.query;
    const where = await buildDataFilter(req.user!);
    if (period) where.period = period;
    if (category) where.category = category;

    const sheetTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor',
      'XLC_REPORT', 'GSF_REPORT', 'WO_REPORT', 'EXPO_REPORT', 'STORE_MASTER', 'RANKING'];
    const result: Record<string, any> = {};

    for (const sheetType of sheetTypes) {
      const latest = await prisma.dataRecord.findFirst({
        where: { ...where, sheetType }, orderBy: { createdAt: 'desc' }
      });
      if (latest) {
        result[sheetType] = {
          data: JSON.parse(latest.dataJson),
          period: latest.period,
          category: latest.category,
          source: latest.source,
          uploadedAt: latest.createdAt
        };
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/data/upload — stage file, no DB write (call POST /switch-source to activate)
router.post('/upload', authMiddleware, (req: AuthRequest, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err instanceof MulterError ? `Upload error: ${err.message}` : err.message;
      res.status(400).json({ error: msg });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Magic byte check: xlsx files are ZIP archives (PK\x03\x04)
    const buf = req.file.buffer;
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b || buf[2] !== 0x03 || buf[3] !== 0x04) {
      res.status(400).json({ error: 'Invalid file: not a valid xlsx archive' });
      return;
    }

    const period = req.body.period || new Date().toISOString().slice(0, 7);
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    let sheets: { sheetType: string; records: any[] }[];
    let category: 'entry' | 'report';

    // Detect if this is a report file (XL Axiata pivot format)
    if (detectReportFile(workbook)) {
      category = 'report';
      const reportData = parseReport(workbook);
      sheets = [
        { sheetType: 'XLC_REPORT', records: reportData.xlcReport },
        { sheetType: 'GSF_REPORT', records: reportData.gsfReport },
        { sheetType: 'WO_REPORT', records: reportData.woReport },
        { sheetType: 'EXPO_REPORT', records: reportData.expoReport },
        { sheetType: 'STORE_MASTER', records: reportData.storeMaster },
        { sheetType: 'RANKING', records: reportData.ranking },
      ].filter(s => s.records.length > 0);
    } else {
      category = 'entry';
      const parsedData = parseWorkbook(req.file.buffer);
      sheets = Object.entries(parsedData)
        .filter(([_, data]) => data && Array.isArray(data) && data.length > 0)
        .map(([sheetType, records]) => ({ sheetType, records: records as any[] }));
    }

    // Save to staging (no DB records yet)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { stagingJson: JSON.stringify({ period, category, sheets }) },
    });

    res.json({
      message: 'File staged. Click "Save & Switch" to activate.',
      period,
      sheets: sheets.map(s => ({ sheetType: s.sheetType, recordsCount: s.records.length })),
    });
  } catch (error) {
    console.error('Upload stage error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// POST /api/data/manual
router.post('/manual', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      sheetType: z.enum(['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor']),
      period: z.string().regex(/^\d{4}-\d{2}$/),
      data: z.array(z.record(z.any()))
    });
    const { sheetType, period, data } = schema.parse(req.body);

    await prisma.dataRecord.upsert({
      where: { sheetType_period_uploadedBy_category: { sheetType, period, uploadedBy: req.user!.id, category: 'entry' } },
      update: { dataJson: JSON.stringify(data), source: 'manual' },
      create: { sheetType, period, category: 'entry', dataJson: JSON.stringify(data), uploadedBy: req.user!.id, source: 'manual' }
    });

    res.json({ message: 'Data saved successfully', recordsCount: data.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors }); return;
    }
    console.error('Manual input error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/data/append
router.post('/append', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      sheetType: z.enum(['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor']),
      period: z.string().regex(/^\d{4}-\d{2}$/),
      row: z.record(z.any())
    });
    const { sheetType, period, row } = schema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.dataRecord.findUnique({
        where: { sheetType_period_uploadedBy_category: { sheetType, period, uploadedBy: req.user!.id, category: 'entry' } }
      });

      const data = existing ? [...JSON.parse(existing.dataJson), row] : [row];

      await tx.dataRecord.upsert({
        where: { sheetType_period_uploadedBy_category: { sheetType, period, uploadedBy: req.user!.id, category: 'entry' } },
        update: { dataJson: JSON.stringify(data), source: 'manual' },
        create: { sheetType, period, category: 'entry', dataJson: JSON.stringify(data), uploadedBy: req.user!.id, source: 'manual' }
      });

      return data.length;
    });

    res.json({ message: 'Row appended successfully', totalRecords: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors }); return;
    }
    console.error('Append error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/data/entry/:sheetType — delete a single entry by index
router.delete('/entry/:sheetType', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sheetType = req.params.sheetType as string;
    const schema = z.object({
      period: z.string().regex(/^\d{4}-\d{2}$/),
      index: z.number().int().min(0)
    });
    const { period, index } = schema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.dataRecord.findUnique({
        where: { sheetType_period_uploadedBy_category: { sheetType, period, uploadedBy: req.user!.id, category: 'entry' } }
      });

      if (!existing) throw new Error('NOT_FOUND');

      const data: any[] = JSON.parse(existing.dataJson);
      if (index >= data.length) throw new Error('OUT_OF_RANGE');

      data.splice(index, 1);

      await tx.dataRecord.update({
        where: { sheetType_period_uploadedBy_category: { sheetType, period, uploadedBy: req.user!.id, category: 'entry' } },
        data: { dataJson: JSON.stringify(data), source: 'manual' }
      });

      return data.length;
    });

    res.json({ message: 'Entry deleted', totalRecords: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors }); return;
    }
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ error: 'No data found' }); return;
    }
    if (error instanceof Error && error.message === 'OUT_OF_RANGE') {
      res.status(400).json({ error: 'Index out of range' }); return;
    }
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/data/sync-master — sync master data (users, assignments, stores, packages, events) from uploaded data
router.post('/sync-master', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.dataRecord.findMany({
      where: { uploadedBy: req.user!.id },
      select: { sheetType: true, dataJson: true },
    });

    const created = { users: 0, assignments: 0, stores: 0, packages: 0, events: 0 };
    const seen = new Set<string>();
    const seenStores = new Set<string>();
    const seenPackages = new Set<string>();
    const seenEvents = new Set<string>();

    for (const record of records) {
      const rows: any[] = JSON.parse(record.dataJson);
      if (!Array.isArray(rows)) continue;

      for (const row of rows) {
        const channel = record.sheetType === 'XLSatu' ? 'XL Satu' : record.sheetType;
        const storeName = row.StoreName || row.XLCName || row.ExpoName || row.Office || '';
        if (!storeName) continue;

        // ── Store ──
        if (!seenStores.has(storeName)) {
          seenStores.add(storeName);
          try {
            await prisma.store.upsert({
              where: { name: storeName },
              update: { channel },
              create: { name: storeName, channel },
            });
            created.stores++;
          } catch { /* dup */ }
        }

        // ── Package ──
        if (row.PackagePlan && channel !== 'GSF' && channel !== 'ELITE') {
          const pkgKey = `${row.PackagePlan}|${channel}`;
          if (!seenPackages.has(pkgKey)) {
            seenPackages.add(pkgKey);
            try {
              await prisma.package.upsert({
                where: { name_channel: { name: row.PackagePlan, channel } },
                update: {},
                create: { name: row.PackagePlan, channel },
              });
              created.packages++;
            } catch { /* dup */ }
          }
        }

        // ── Event (GSF only) ──
        if (row.EventName && !seenEvents.has(row.EventName)) {
          seenEvents.add(row.EventName);
          try {
            await prisma.eventType.upsert({
              where: { name: row.EventName },
              update: {},
              create: { name: row.EventName },
            });
            created.events++;
          } catch { /* dup */ }
        }

        // ── People + Assignments ──
        const people: { name: string; roleType: string; usernameAgent?: string }[] = [];

        if (channel === 'GSF') {
          if (row.Operator) people.push({ name: row.Operator, roleType: 'OPERATOR' });
        } else if (channel === 'WO') {
          if (row.AgentWO) people.push({ name: row.AgentWO, roleType: 'AGENT_WO', usernameAgent: row.UsernameAgent });
          if (row.Leader) people.push({ name: row.Leader, roleType: 'LEADER' });
        } else if (channel === 'EXPO') {
          if (row.NamaPromotor) people.push({ name: row.NamaPromotor, roleType: 'PROMOTOR', usernameAgent: row.UsernameAgent });
          if (row.Leader) people.push({ name: row.Leader, roleType: 'LEADER' });
        } else {
          if (row.NamaCRR) people.push({ name: row.NamaCRR, roleType: 'CRR', usernameAgent: row.UsernameAgent });
          if (row.RSM) people.push({ name: row.RSM, roleType: 'RSM' });
          if (row.SM) people.push({ name: row.SM, roleType: 'SM' });
        }
        if (row.RSM && (channel === 'WO' || channel === 'EXPO' || channel === 'GSF')) {
          if (!people.find(p => p.roleType === 'RSM')) people.push({ name: row.RSM, roleType: 'RSM' });
        }

        for (const p of people) {
          const key = `${p.name}|${storeName}|${channel}|${p.roleType}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const user = await prisma.user.upsert({
            where: { username: p.name.toLowerCase().replace(/\s+/g, '.') },
            update: { displayName: p.name },
            create: {
              username: p.name.toLowerCase().replace(/\s+/g, '.'),
              passwordHash: '',
              displayName: p.name,
              role: 'CRR',
            },
          });
          created.users++;

          try {
            await prisma.userAssignment.upsert({
              where: { userId_storeName_channel_roleType: { userId: user.id, storeName, channel, roleType: p.roleType } },
              update: { usernameAgent: p.usernameAgent ?? null },
              create: { userId: user.id, storeName, channel, roleType: p.roleType, usernameAgent: p.usernameAgent ?? null },
            });
            created.assignments++;
          } catch { /* dup */ }
        }
      }
    }

    res.json({ message: 'Master data synced', created });
  } catch (error) {
    console.error('Sync master error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as dataRoutes };
