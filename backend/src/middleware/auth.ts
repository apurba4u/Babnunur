/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../core/errors';
import { RequestUser } from '../core/types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

// Simple in-memory session store for tokens
const tokenStore = new Map<string, { userId: string; email: string; name: string }>();

export const setSessionToken = (token: string, user: { userId: string; email: string; name: string }): void => {
  tokenStore.set(token, user);
};

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token');
    }

    const token = authHeader.substring(7);
    const session = tokenStore.get(token);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: 'user',
    };
    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
};
