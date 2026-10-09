import { Request, Response, NextFunction } from 'express';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db.js';

export const AUTH_COOKIE_NAME = 'analitics_session';
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
};

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
}

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
  sessionVersion: number;
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
  const token = parse(req.headers.cookie || '')[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  let decoded: AuthUser;
  try {
    decoded = verifyToken(token);
  } catch {
    clearAuthCookie(res);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, region: true, center: true, crrName: true, channel: true, sessionVersion: true }
    });
  } catch (error) {
    next(error);
    return;
  }

  if (!user || user.sessionVersion !== decoded.sessionVersion) {
    clearAuthCookie(res);
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  req.user = user;
  next();
}
