import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorResponseBody } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  const requestId = res.getHeader('x-request-id') as string | undefined;

  if (err instanceof AppError) {
    const body: ErrorResponseBody = {
      error: {
        message: err.message,
        code: err.code,
        requestId,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ErrorResponseBody = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
      },
    };
    res.status(400).json(body);
    return;
  }

  logger.error({ err, requestId, path: req.path }, 'Unhandled error');

  const body: ErrorResponseBody = {
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      requestId,
    },
  };
  res.status(500).json(body);
}
