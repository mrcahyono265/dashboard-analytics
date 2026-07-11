import { Router, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { parseExcelData } from '../lib/parser.js';

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// Helper: Build where clause based on role
async function buildDataFilter(user: any, sheetType?: string) {
  const where: any = {};

  if (sheetType) {
    where.sheetType = sheetType;
  }

  // Role-based filtering
  if (user.role === 'CRR') {
    // CRR: only see their own data
    where.uploadedBy = user.id;
  } else if (user.role === 'STORE_MANAGER') {
    // Store Manager: see all CRRs in their center
    const crrUsers = await prisma.user.findMany({
      where: { center: user.center, role: 'CRR' },
      select: { id: true }
    });
    where.uploadedBy = { in: crrUsers.map(u => u.id) };
  }
  // RSE: no filter, see all

  return where;
}

// GET /api/data/:sheetType - Get data for a specific sheet type
router.get('/:sheetType', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sheetType } = req.params;
    const { period } = req.query;

    const validSheetTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor'];
    if (!validSheetTypes.includes(sheetType)) {
      res.status(400).json({ error: 'Invalid sheet type' });
      return;
    }

    const where = await buildDataFilter(req.user!, sheetType);
    if (period) {
      where.period = period;
    }

    const records = await prisma.dataRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (records.length === 0) {
      res.json({ data: [], period: null });
      return;
    }

    const latest = records[0];
    res.json({
      data: JSON.parse(latest.dataJson),
      period: latest.period,
      source: latest.source,
      uploadedAt: latest.createdAt
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/data - Get all data overview
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period } = req.query;

    const where = await buildDataFilter(req.user!);
    if (period) {
      where.period = period;
    }

    const sheetTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor'];
    const result: Record<string, any> = {};

    for (const sheetType of sheetTypes) {
      const latest = await prisma.dataRecord.findFirst({
        where: { ...where, sheetType },
        orderBy: { createdAt: 'desc' }
      });

      if (latest) {
        result[sheetType] = {
          data: JSON.parse(latest.dataJson),
          period: latest.period,
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

// POST /api/data/upload - Upload Excel file
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const period = req.body.period || new Date().toISOString().slice(0, 7);

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const parsedData = parseExcelData(workbook);

    const results: { sheetType: string; recordsCount: number }[] = [];

    for (const [sheetType, data] of Object.entries(parsedData)) {
      if (data && Array.isArray(data) && data.length > 0) {
        await prisma.dataRecord.upsert({
          where: {
            sheetType_period_uploadedBy: {
              sheetType,
              period,
              uploadedBy: req.user!.id
            }
          },
          update: {
            dataJson: JSON.stringify(data),
            source: 'upload'
          },
          create: {
            sheetType,
            period,
            dataJson: JSON.stringify(data),
            uploadedBy: req.user!.id,
            source: 'upload'
          }
        });

        results.push({ sheetType, recordsCount: data.length });
      }
    }

    res.json({
      message: 'File uploaded successfully',
      period,
      sheets: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// POST /api/data/manual - Manual input per row
router.post('/manual', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      sheetType: z.enum(['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor']),
      period: z.string().regex(/^\d{4}-\d{2}$/),
      data: z.array(z.record(z.any()))
    });

    const { sheetType, period, data } = schema.parse(req.body);

    await prisma.dataRecord.upsert({
      where: {
        sheetType_period_uploadedBy: {
          sheetType,
          period,
          uploadedBy: req.user!.id
        }
      },
      update: {
        dataJson: JSON.stringify(data),
        source: 'manual'
      },
      create: {
        sheetType,
        period,
        dataJson: JSON.stringify(data),
        uploadedBy: req.user!.id,
        source: 'manual'
      }
    });

    res.json({
      message: 'Data saved successfully',
      recordsCount: data.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Manual input error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/data/append - Append row to existing data
router.post('/append', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      sheetType: z.enum(['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor']),
      period: z.string().regex(/^\d{4}-\d{2}$/),
      row: z.record(z.any())
    });

    const { sheetType, period, row } = schema.parse(req.body);

    // Get existing data
    const existing = await prisma.dataRecord.findUnique({
      where: {
        sheetType_period_uploadedBy: {
          sheetType,
          period,
          uploadedBy: req.user!.id
        }
      }
    });

    let data: any[];
    if (existing) {
      data = [...JSON.parse(existing.dataJson), row];
    } else {
      data = [row];
    }

    await prisma.dataRecord.upsert({
      where: {
        sheetType_period_uploadedBy: {
          sheetType,
          period,
          uploadedBy: req.user!.id
        }
      },
      update: {
        dataJson: JSON.stringify(data),
        source: 'manual'
      },
      create: {
        sheetType,
        period,
        dataJson: JSON.stringify(data),
        uploadedBy: req.user!.id,
        source: 'manual'
      }
    });

    res.json({
      message: 'Row appended successfully',
      totalRecords: data.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Append error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as dataRoutes };
