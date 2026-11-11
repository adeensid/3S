import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { routeParam } from '../lib/routeParams.js';
import {
  createCustomField,
  listCustomFields,
} from '../services/customFieldService.js';
import { listFieldHistory } from '../services/fieldHistoryService.js';
import { createIssueLink, listIssueLinks } from '../services/issueLinkService.js';
import { addWatcher, listWatchers } from '../services/watcherService.js';
import { addWorkLog, listWorkLogs } from '../services/workLogService.js';
import { bulkUpdateTickets } from '../services/ticketService.js';
import { listAttachments, registerAttachment } from '../services/attachmentService.js';

export async function listCustomFieldsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const fields = await listCustomFields(user, routeParam(req.params.projectId));
  res.json({ fields });
}

export async function createCustomFieldHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const field = await createCustomField(user, routeParam(req.params.projectId), req.body);
  res.status(201).json({ field });
}

export async function listIssueLinksHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const links = await listIssueLinks(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
  );
  res.json({ links });
}

export async function createIssueLinkHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const link = await createIssueLink(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    req.body,
  );
  res.status(201).json({ link });
}

export async function listWatchersHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const watchers = await listWatchers(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
  );
  res.json({ watchers });
}

export async function addWatcherHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const watcher = await addWatcher(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    typeof req.body.userId === 'string' ? req.body.userId : undefined,
  );
  res.status(201).json({ watcher });
}

export async function listWorkLogsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const logs = await listWorkLogs(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
  );
  res.json({ workLogs: logs });
}

export async function addWorkLogHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const workLog = await addWorkLog(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    req.body,
  );
  res.status(201).json({ workLog });
}

export async function listFieldHistoryHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const history = await listFieldHistory(routeParam(req.params.ticketId));
  res.json({ history });
}

export async function bulkUpdateHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const summary = await bulkUpdateTickets(user, routeParam(req.params.projectId), req.body);
  res.json(summary);
}

export async function listAttachmentsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const attachments = await listAttachments(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
  );
  res.json({ attachments });
}

export async function registerAttachmentHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  const attachment = await registerAttachment(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    req.body,
  );
  res.status(201).json({ attachment });
}
