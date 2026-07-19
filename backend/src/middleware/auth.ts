/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth';
import { UnauthorizedError } from '../core/errors';
import { RequestUser } from '../core/types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      throw new UnauthorizedError('Authentication required');
    }
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as Record<string, unknown>).role as string || 'user',
    };
    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
};
