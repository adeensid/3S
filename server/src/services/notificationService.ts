import { Types } from 'mongoose';
import { Notification, type NotificationKind } from '../models/Notification.js';

export async function createNotification(params: {
  userId: Types.ObjectId;
  kind: NotificationKind;
  ticketId: Types.ObjectId;
  projectId: Types.ObjectId;
  message: string;
}): Promise<void> {
  await Notification.create({
    userId: params.userId,
    kind: params.kind,
    ticketId: params.ticketId,
    projectId: params.projectId,
    message: params.message,
    readAt: null,
  });
}

export async function listNotifications(userId: string, cursor?: string, limit = 20) {
  const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }
  const items = await Notification.find(query).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? slice[slice.length - 1]?._id.toString() : null;
  return { items: slice, nextCursor };
}

export async function unreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({ userId, readAt: null });
}

export async function markAllRead(userId: string): Promise<void> {
  await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() });
}
