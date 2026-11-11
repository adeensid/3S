import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { roleCan, type PermissionAction } from '../permissions/rules.js';

export function requirePermission(action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.currentUser;
    if (!user) {
      next(new AppError('Authorization required', 401, 'UNAUTHORIZED'));
      return;
    }
    if (!roleCan(user.role, action)) {
      next(new AppError('You do not have permission for this action', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
