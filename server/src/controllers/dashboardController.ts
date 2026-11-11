import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { projectDashboard } from '../services/dashboardService.js';
import { routeParam } from '../lib/routeParams.js';

export async function dashboardHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const stats = await projectDashboard(user, routeParam(req.params.projectId));
  res.json({ stats });
}
