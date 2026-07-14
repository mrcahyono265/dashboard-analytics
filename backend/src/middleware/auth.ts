import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db.js';

const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW || JWT_SECRET_RAW.length < 32) {
  console.error('FATAL: JWT_SECRET missing or too short (min 32 chars). Set it in .env');
  process.exit(1);
}
const JWT_SECRET: string = JWT_SECRET_RAW;

export interface AuthUser {
  id: string;
  username: string;
  role: string; // 'RSE' | 'STORE_MANAGER' | 'CRR'
  region?: string | null;
  center?: string | null;
  crrName?: string | null;
  channel?: string | null; // 'XLC' | 'GSF' — for CRR role
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string & {};
  return jwt.sign(user, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, region: true, center: true, crrName: true, channel: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
