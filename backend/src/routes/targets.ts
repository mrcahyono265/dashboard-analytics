import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireRSE, requireManagerOrAbove } from '../middleware/rbac.js';

const router = Router();

// GET /api/targets - Get targets
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { period, channel } = req.query;

    const where: any = {};
    if (period) where.period = period;
    if (channel) where.channel = channel;

    const targets = await prisma.target.findMany({
      where,
      orderBy: [{ period: 'desc' }, { channel: 'asc' }, { center: 'asc' }, { staffName: 'asc' }]
    });

    res.json({ targets });
  } catch (error) {
    console.error('Get targets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/targets - Create/Update target (RSE only)
router.post('/', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      channel: z.enum(['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu']),
      targetValue: z.number().positive(),
      period: z.string().regex(/^\d{4}-\d{2}$/),
      center: z.string().optional(),
      staffName: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const center = data.center ?? '';
    const staffName = data.staffName ?? '';

    const target = await prisma.target.upsert({
      where: {
        channel_period_center_staffName: {
          channel: data.channel,
          period: data.period,
          center,
          staffName,
        }
      },
      update: { targetValue: data.targetValue },
      create: {
        channel: data.channel,
        targetValue: data.targetValue,
        period: data.period,
        center,
        staffName,
      }
    });

    res.json({ target });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/targets/bulk - Create multiple targets (RSE only)
router.post('/bulk', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      period: z.string().regex(/^\d{4}-\d{2}$/),
      targets: z.array(z.object({
        channel: z.enum(['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu']),
        targetValue: z.number().positive(),
        center: z.string().optional(),
        staffName: z.string().optional(),
      }))
    });

    const { period, targets } = schema.parse(req.body);

    const results = await Promise.all(
      targets.map(t => {
        const center = t.center ?? '';
        const staffName = t.staffName ?? '';
        return prisma.target.upsert({
          where: {
            channel_period_center_staffName: {
              channel: t.channel,
              period,
              center,
              staffName,
            }
          },
          update: { targetValue: t.targetValue },
          create: {
            channel: t.channel,
            targetValue: t.targetValue,
            period,
            center,
            staffName,
          }
        });
      })
    );

    res.json({ targets: results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Bulk target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/targets/:id - Delete target (RSE only)
router.delete('/:id', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }
    await prisma.target.delete({ where: { id } });
    res.json({ message: 'Target deleted' });
  } catch (error) {
    console.error('Delete target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as targetRoutes };
