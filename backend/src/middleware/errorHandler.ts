import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';
import { config } from '../config';
import { captureError } from '../shared/monitoring';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string | undefined;

  if (err instanceof AppError) {
    captureError(err, {
      requestId,
      statusCode: err.statusCode,
      code: err.code,
      path: req.originalUrl,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  captureError(err, {
    requestId,
    statusCode: 500,
    path: req.originalUrl,
    method: req.method,
    unhandled: true,
  });

  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
