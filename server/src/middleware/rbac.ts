import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

type Role = 'ADMIN' | 'MANAGER' | 'SALES';

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

export function requireManagerOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
    res.status(403).json({ error: 'Manager or Admin access required' });
    return;
  }

  next();
}
