import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200),
      channel: z.enum(['XLC', 'GSF', 'WO', 'EXPO', 'Merchant', 'XL Satu']),
      region: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const store = await prisma.store.create({ data });
    res.json({ store });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2002') {
      res.status(409).json({ error: 'Store already exists' });
      return;
    }
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      channel: z.enum(['XLC', 'GSF', 'WO', 'EXPO', 'Merchant', 'XL Satu']).optional(),
      region: z.string().optional().nullable(),
    });
    const data = schema.parse(req.body);
    const store = await prisma.store.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json({ store });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.store.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Store deleted' });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as storeRoutes };
