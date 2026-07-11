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

    const where: any = { sheetType };
    if (period) {
      where.period = period;
    }

    // Role-based filtering
    if (req.user!.role === 'SALES') {
      where.uploadedBy = req.user!.id;
    }

    const records = await prisma.dataRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10 // Latest 10 records
    });

    // Return the latest record's data
    if (records.length === 0) {
      res.json({ data: [], period: null });
      return;
    }

    const latest = records[0];
    res.json({
      data: latest.dataJson,
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

    const where: any = {};
    if (period) {
      where.period = period;
    }

    // Role-based filtering
    if (req.user!.role === 'SALES') {
      where.uploadedBy = req.user!.id;
    }

    // Get latest record for each sheet type
    const sheetTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor'];
    const result: Record<string, any> = {};

    for (const sheetType of sheetTypes) {
      const latest = await prisma.dataRecord.findFirst({
        where: { ...where, sheetType },
        orderBy: { createdAt: 'desc' }
      });

      if (latest) {
        result[sheetType] = {
          data: latest.dataJson,
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

    const period = req.body.period || new Date().toISOString().slice(0, 7); // Default: YYYY-MM

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });

    // Parse all sheets
    const parsedData = parseExcelData(workbook);

    // Store each sheet type in database
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
            dataJson: data,
            source: 'upload'
          },
          create: {
            sheetType,
            period,
            dataJson: data,
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

// GET /api/data/overview/stats - Get aggregated statistics
router.get('/overview/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period } = req.query;

    const where: any = {};
    if (period) {
      where.period = period;
    }

    // Role-based filtering
    if (req.user!.role === 'SALES') {
      where.uploadedBy = req.user!.id;
    }

    const records = await prisma.dataRecord.findMany({
      where,
      select: {
        sheetType: true,
        period: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by period and sheet type
    const stats: Record<string, Record<string, { count: number; lastUpload: Date }>> = {};

    for (const record of records) {
      if (!stats[record.period]) {
        stats[record.period] = {};
      }
      if (!stats[record.period][record.sheetType]) {
        stats[record.period][record.sheetType] = {
          count: 0,
          lastUpload: record.createdAt
        };
      }
      stats[record.period][record.sheetType].count++;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as dataRoutes };
