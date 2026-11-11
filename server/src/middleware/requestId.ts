import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('x-request-id', id);
  req.requestId = id;
  next();
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}
