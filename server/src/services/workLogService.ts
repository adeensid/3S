import { z } from 'zod';
import { WorkLog } from '../models/WorkLog.js';
import { Ticket } from '../models/Ticket.js';
import { AppError } from '../lib/errors.js';
import { getProjectForMember } from './projectService.js';
import type { UserDocument } from '../models/User.js';

const workLogSchema = z.object({
  timeSpentMinutes: z.number().int().min(1).max(60 * 24 * 14),
  note: z.string().max(2000).optional(),
  startedAt: z.string().datetime(),
});

export async function addWorkLog(actor: UserDocument, projectId: string, issueId: string, input: unknown) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = workLogSchema.parse(input);
  const issue = await Ticket.findOne({ _id: issueId, projectId });
  if (!issue) throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');

  const log = await WorkLog.create({
    issueId: issue._id,
    projectId: issue.projectId,
    authorId: actor._id,
    timeSpentMinutes: data.timeSpentMinutes,
    note: data.note ?? '',
    startedAt: new Date(data.startedAt),
  });

  issue.timeSpentMinutes += data.timeSpentMinutes;
  issue.revision += 1;
  await issue.save();

  return {
    id: log._id.toString(),
    issueId: issueId,
    authorId: actor._id.toString(),
    timeSpentMinutes: log.timeSpentMinutes,
    note: log.note,
    startedAt: log.startedAt.toISOString(),
    createdAt: log.createdAt.toISOString(),
  };
}

export async function listWorkLogs(actor: UserDocument, projectId: string, issueId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const logs = await WorkLog.find({ issueId, projectId }).sort({ startedAt: -1 });
  return logs.map((log) => ({
    id: log._id.toString(),
    issueId: log.issueId.toString(),
    authorId: log.authorId.toString(),
    timeSpentMinutes: log.timeSpentMinutes,
    note: log.note,
    startedAt: log.startedAt.toISOString(),
    createdAt: log.createdAt.toISOString(),
  }));
}
