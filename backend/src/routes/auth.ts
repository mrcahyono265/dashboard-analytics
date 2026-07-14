import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/db.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

// Brute-force protection: 5 login attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1),
  isAdmin: z.boolean().optional().default(false),
});

const profileUpdateSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional()
});

// POST /api/auth/login — rate-limited to prevent brute force
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.passwordHash) {
      res.status(403).json({ error: 'Akun belum aktif. Silakan hubungi RSE untuk mengatur password.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      region: user.region,
      center: user.center,
      crrName: user.crrName,
      channel: user.channel
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        region: user.region,
        center: user.center,
        crrName: user.crrName,
        channel: user.channel,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register (RSE only)
router.post('/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Only RSE can register new users
    if (req.user!.role !== 'RSE') {
      res.status(403).json({ error: 'Only RSE can register users' });
      return;
    }

    const data = registerSchema.parse(req.body);

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
        role: data.isAdmin ? 'RSE' : 'CRR',
      }
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        region: true,
        center: true,
        crrName: true,
        channel: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/profile — self-service profile update (email, phone, avatar only)
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = profileUpdateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true, username: true, displayName: true, role: true,
        email: true, phone: true, avatarUrl: true
      }
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/avatar — upload avatar
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const current = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { avatarUrl: true } });
    if (current?.avatarUrl) {
      const oldPath = path.resolve(process.cwd(), 'uploads', 'avatars', path.basename(current.avatarUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
      select: { avatarUrl: true }
    });
    res.json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/avatar — remove avatar
router.delete('/avatar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { avatarUrl: true } });
    if (current?.avatarUrl) {
      const oldPath = path.resolve(process.cwd(), 'uploads', 'avatars', path.basename(current.avatarUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: null }
    });
    res.json({ message: 'Avatar removed' });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRoutes };
