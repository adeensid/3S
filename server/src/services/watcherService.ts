import { Types } from 'mongoose';
import { Watcher } from '../models/Watcher.js';
import { Ticket } from '../models/Ticket.js';
import { AppError } from '../lib/errors.js';
import { getProjectForMember } from './projectService.js';
import type { UserDocument } from '../models/User.js';

export async function addWatcher(
  actor: UserDocument,
  projectId: string,
  issueId: string,
  userId?: string,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const issue = await Ticket.findOne({ _id: issueId, projectId });
  if (!issue) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
  const watcherId = new Types.ObjectId(userId ?? actor._id.toString());
  await Watcher.updateOne({ issueId: issue._id, userId: watcherId }, { $setOnInsert: { issueId: issue._id, userId: watcherId } }, { upsert: true });
  return { issueId, userId: watcherId.toString() };
}

export async function listWatchers(actor: UserDocument, projectId: string, issueId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const watchers = await Watcher.find({ issueId });
  return watchers.map((row) => ({ id: row._id.toString(), userId: row.userId.toString() }));
}
