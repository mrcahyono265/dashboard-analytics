import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const CHANNELS = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XL Satu'] as const;

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: [{ channel: 'asc' }, { name: 'asc' }]
    });
    res.json({ packages });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200),
      channel: z.enum(CHANNELS),
      category: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const pkg = await prisma.package.create({ data });
    res.json({ package: pkg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2002') {
      res.status(409).json({ error: 'Package already exists for this channel' });
      return;
    }
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      channel: z.enum(CHANNELS).optional(),
      category: z.string().optional().nullable(),
    });
    const data = schema.parse(req.body);
    const pkg = await prisma.package.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json({ package: pkg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.package.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Package deleted' });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as packageRoutes };
