import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/auth';
import { UnauthorizedError } from '../core/errors';
import { RequestUser } from '../core/types';
import { User } from '../features/users/models/user.model';

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : String(value));
    }

    const session = await (await getAuth()).api.getSession({ headers });
    if (!session || !session.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const dbUser = await User.findById(session.user.id).select('role theme timezone language').lean();
    const role = (dbUser as Record<string, unknown> | null)?.role as string || (session.user as Record<string, unknown>).role as string || 'user';

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };
    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
};
