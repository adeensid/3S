import { ActivityLog } from '../models/ActivityLog.js';
import type { Types } from 'mongoose';

export async function recordActivity(params: {
  projectId: Types.ObjectId;
  ticketId?: Types.ObjectId | null;
  actorId: Types.ObjectId;
  action: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
}): Promise<void> {
  await ActivityLog.create({
    projectId: params.projectId,
    ticketId: params.ticketId ?? null,
    actorId: params.actorId,
    action: params.action,
    changes: params.changes ?? {},
  });
}
