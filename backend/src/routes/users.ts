import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireRSE } from '../middleware/rbac.js';

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  displayName: z.string().min(1),
  isAdmin: z.boolean().optional().default(false),
}).refine(d => d.password === d.confirmPassword, { message: 'Password dan konfirmasi tidak cocok' });

const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  isAdmin: z.boolean().optional(),
  password: z.string().min(6).optional(),
  confirmPassword: z.string().min(6).optional(),
}).refine(d => !d.password || d.password === d.confirmPassword, { message: 'Password dan konfirmasi tidak cocok' });

const setPasswordSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(d => d.password === d.confirmPassword, { message: 'Password dan konfirmasi tidak cocok' });

router.get('/', authMiddleware, requireRSE, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, displayName: true, role: true, passwordHash: true, createdAt: true,
        _count: { select: { uploadedData: true, assignments: true } }
      },
      orderBy: [{ role: 'asc' }, { displayName: 'asc' }]
    });

    const usersWithInfo = await Promise.all(users.map(async (u) => {
      const assignments = await prisma.userAssignment.findMany({
        where: { userId: u.id },
        select: { channel: true, storeName: true, roleType: true, usernameAgent: true },
        orderBy: [{ channel: 'asc' }, { storeName: 'asc' }],
      });
      const { passwordHash, ...rest } = u;
      return { ...rest, hasPassword: !!passwordHash, assignments };
    }));

    res.json({ users: usersWithInfo });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hierarchy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role === 'STORE_MANAGER') where.center = req.user!.center;
    else if (req.user!.role === 'CRR') where.id = req.user!.id;

    const users = await prisma.user.findMany({
      where,
      select: { id: true, username: true, displayName: true, role: true },
      orderBy: [{ role: 'asc' }, { displayName: 'asc' }]
    });
    res.json({ users });
  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) { res.status(409).json({ error: 'Username already exists' }); return; }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        displayName: data.displayName,
        role: data.isAdmin ? 'RSE' : 'CRR',
      },
      select: { id: true, username: true, displayName: true, role: true, createdAt: true }
    });

    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'User not found' }); return; }

    const updateData: any = {};
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.isAdmin !== undefined) updateData.role = data.isAdmin ? 'RSE' : 'CRR';
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, displayName: true, role: true, updatedAt: true }
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/set-password — admin sets password (no currentPassword required)
router.post('/:id/set-password', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { password } = setPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.json({ message: 'Password berhasil diatur' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') { res.status(404).json({ error: 'User not found' }); return; }
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, requireRSE, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (id === req.user!.id) { res.status(400).json({ error: 'Cannot delete yourself' }); return; }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ error: 'User not found' }); return; }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userRoutes };
