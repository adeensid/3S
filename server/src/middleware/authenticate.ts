import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import type { UserDocument } from '../models/User.js';
import { getUserFromAccessToken } from '../services/authService.js';
import { asyncHandler } from './asyncHandler.js';

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: UserDocument;
  }
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = await getUserFromAccessToken(req.header('authorization'));
    req.currentUser = user;
    next();
  },
);

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    next(new AppError('Authorization required', 401, 'UNAUTHORIZED'));
    return;
  }
  next();
}
