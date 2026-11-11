import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import {
  archiveProject,
  createProject,
  listProjectsForUser,
  setProjectMembers,
  updateProject,
} from '../services/projectService.js';
import { routeParam } from '../lib/routeParams.js';

export async function listProjectsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const projects = await listProjectsForUser(user._id.toString());
  res.json({ projects });
}

export async function createProjectHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const project = await createProject(user, req.body);
  res.status(201).json({ project });
}

export async function updateProjectHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const project = await updateProject(user, routeParam(req.params.projectId), req.body);
  res.json({ project });
}

export async function archiveProjectHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const project = await archiveProject(user, routeParam(req.params.projectId));
  res.json({ project });
}

export async function setMembersHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const project = await setProjectMembers(user, routeParam(req.params.projectId), req.body);
  res.json({ project });
}
