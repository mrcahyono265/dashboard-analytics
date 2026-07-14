import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireRSE } from '../middleware/rbac.js';

const router = Router();

const CHANNELS = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XL Satu'] as const;
const ROLE_TYPES = ['CRR', 'RSM', 'SM', 'OPERATOR', 'AGENT_WO', 'PROMOTOR', 'LEADER'] as const;

const createSchema = z.object({
  userId: z.string().min(1),
  channel: z.enum(CHANNELS),
  storeName: z.string().min(1),
  roleType: z.enum(ROLE_TYPES),
  usernameAgent: z.string().optional().nullable(),
});

const updateSchema = z.object({
  channel: z.enum(CHANNELS).optional(),
  storeName: z.string().min(1).optional(),
  roleType: z.enum(ROLE_TYPES).optional(),
  usernameAgent: z.string().optional().nullable(),
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, store, channel, roleType } = req.query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (store) where.storeName = store;
    if (channel) where.channel = channel;
    if (roleType) where.roleType = roleType;

    const assignments = await prisma.userAssignment.findMany({
      where,
      include: { user: { select: { id: true, username: true, displayName: true } } },
      orderBy: [{ channel: 'asc' }, { storeName: 'asc' }],
    });
    res.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const assignment = await prisma.userAssignment.create({ data });
    res.json({ assignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2002') {
      res.status(409).json({ error: 'Assignment already exists for this user at this store/channel/role' });
      return;
    }
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const assignment = await prisma.userAssignment.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json({ assignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.userAssignment.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userAssignmentRoutes };
