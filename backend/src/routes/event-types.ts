import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.eventType.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ events });
  } catch (error) {
    console.error('Get event-types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({ name: z.string().min(1).max(200) });
    const { name } = schema.parse(req.body);
    const event = await prisma.eventType.create({ data: { name } });
    res.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2002') {
      res.status(409).json({ error: 'Event type already exists' });
      return;
    }
    console.error('Create event-type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({ name: z.string().min(1).max(200) });
    const { name } = schema.parse(req.body);
    const event = await prisma.eventType.update({
      where: { id: req.params.id as string },
      data: { name },
    });
    res.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Event type not found' });
      return;
    }
    console.error('Update event-type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.eventType.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Event type deleted' });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Event type not found' });
      return;
    }
    console.error('Delete event-type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as eventTypeRoutes };
