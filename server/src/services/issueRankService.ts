import { Types } from 'mongoose';
import { rankAfter, rankBefore, rankBetween, initialRank } from '../lib/lexorank.js';
import { Ticket } from '../models/Ticket.js';

export async function nextBacklogRank(projectId: Types.ObjectId, sprintId?: Types.ObjectId | null) {
  const filter: Record<string, unknown> = { projectId };
  if (sprintId) filter.sprintId = sprintId;

  const last = await Ticket.findOne(filter).sort({ rank: -1 }).select('rank');
  return rankAfter(last?.rank ?? null);
}

export async function rankAtIndex(
  projectId: Types.ObjectId,
  beforeIssueId: string | null,
  afterIssueId: string | null,
) {
  const before = beforeIssueId
    ? await Ticket.findOne({ _id: beforeIssueId, projectId }).select('rank')
  : null;
  const after = afterIssueId
    ? await Ticket.findOne({ _id: afterIssueId, projectId }).select('rank')
  : null;

  const left = before?.rank ?? null;
  const right = after?.rank ?? null;

  if (!left && !right) return initialRank();
  if (left && right) return rankBetween(left, right);
  if (left) return rankAfter(left);
  if (right) return rankBefore(right);
  return initialRank();
}
