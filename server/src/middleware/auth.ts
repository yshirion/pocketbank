import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  isParent?: boolean;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      isParent: boolean;
    };
    req.userId = payload.userId;
    req.isParent = payload.isParent;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireParent(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.isParent) {
    res.status(403).json({ error: 'Parent access required' });
    return;
  }
  next();
}
