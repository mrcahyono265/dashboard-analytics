import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES']).default('SALES'),
  rsm: z.string().optional(),
  sm: z.string().optional(),
  storeName: z.string().optional()
});

const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES']).optional(),
  rsm: z.string().optional(),
  sm: z.string().optional(),
  storeName: z.string().optional(),
  password: z.string().min(6).optional()
});

// GET /api/users - List all users (admin only)
router.get('/', authMiddleware, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        rsm: true,
        sm: true,
        storeName: true,
        createdAt: true,
        _count: {
          select: { uploadedData: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        displayName: data.displayName,
        role: data.role,
        rsm: data.rsm,
        sm: data.sm,
        storeName: data.storeName
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        rsm: true,
        sm: true,
        storeName: true,
        createdAt: true
      }
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

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        rsm: true,
        sm: true,
        storeName: true,
        updatedAt: true
      }
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

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userRoutes };
