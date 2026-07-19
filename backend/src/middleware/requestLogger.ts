import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { recordRequest } from '../shared/metrics';
import { captureMetric, captureEvent } from '../shared/monitoring';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  captureEvent('request.start', { requestId, method: req.method, url: req.originalUrl });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    recordRequest(duration, isError);

    captureMetric('http.request.duration', duration, {
      method: req.method,
      status: String(res.statusCode),
      path: req.originalUrl,
    });

    if (isError) {
      captureMetric('http.request.error', 1, {
        method: req.method,
        status: String(res.statusCode),
        path: req.originalUrl,
      });
    }

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
    else console.info(JSON.stringify(log));
  });

  next();
};
