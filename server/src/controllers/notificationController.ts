import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { listNotifications, markAllRead, unreadCount } from '../services/notificationService.js';

export async function listNotificationsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const result = await listNotifications(user._id.toString(), cursor);
  res.json({
    notifications: result.items.map((item) => ({
      id: item._id.toString(),
      kind: item.kind,
      ticketId: item.ticketId.toString(),
      projectId: item.projectId.toString(),
      message: item.message,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
    nextCursor: result.nextCursor,
  });
}

export async function unreadCountHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const count = await unreadCount(user._id.toString());
  res.json({ count });
}

export async function markAllReadHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  await markAllRead(user._id.toString());
  res.status(204).send();
}
