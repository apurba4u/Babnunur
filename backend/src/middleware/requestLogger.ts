import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
    if (res.statusCode >= 500) console.error(JSON.stringify(log));
    else if (duration > 5000) console.warn(JSON.stringify(log));
    else console.log(JSON.stringify(log));
  });

  next();
};
