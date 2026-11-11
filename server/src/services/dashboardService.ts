import { Types } from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { getProjectForMember } from './projectService.js';
import type { UserDocument } from '../models/User.js';

export async function projectDashboard(actor: UserDocument, projectId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const projectObjectId = new Types.ObjectId(projectId);
  const now = new Date();
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const [weekly, severity, perAssignee, medianClose, overdue] = await Promise.all([
    Ticket.aggregate<{ week: string; open: number; closed: number }>([
      { $match: { projectId: projectObjectId, createdAt: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%G-W%V', date: '$createdAt' },
          },
          open: {
            $sum: { $cond: [{ $ne: ['$status', 'done'] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, week: '$_id', open: 1, closed: 1 } },
    ]),
    Ticket.aggregate<{ severity: string; count: number }>([
      { $match: { projectId: projectObjectId, type: 'bug', status: { $ne: 'done' } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $project: { _id: 0, severity: '$_id', count: 1 } },
    ]),
    Ticket.aggregate<{ assigneeId: string | null; count: number }>([
      { $match: { projectId: projectObjectId, status: { $ne: 'done' } } },
      { $group: { _id: '$assigneeId', count: { $sum: 1 } } },
      { $project: { _id: 0, assigneeId: { $toString: '$_id' }, count: 1 } },
    ]),
    Ticket.aggregate<{ medianHours: number | null }>([
      { $match: { projectId: projectObjectId, closedAt: { $ne: null } } },
      {
        $project: {
          hours: {
            $divide: [{ $subtract: ['$closedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
      { $group: { _id: null, medianHours: { $avg: '$hours' } } },
      { $project: { _id: 0, medianHours: 1 } },
    ]),
    Ticket.countDocuments({
      projectId: projectObjectId,
      status: { $ne: 'done' },
      dueDate: { $lt: now },
    }),
  ]);

  return {
    openVsClosedByWeek: weekly,
    openBugsBySeverity: severity,
    openTicketsPerAssignee: perAssignee,
    medianHoursToClose: medianClose[0]?.medianHours ?? null,
    overdueCount: overdue,
  };
}
