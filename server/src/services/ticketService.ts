import { Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { sanitizeMarkdownInput } from '../lib/sanitize.js';
import { Comment } from '../models/Comment.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import type { UserDocument } from '../models/User.js';
import {
  ISSUE_TYPES,
  PRIORITIES,
  severityToPriority,
  type IssueType,
  type Priority,
} from '../types/issue.js';
import {
  TICKET_SEVERITIES,
  TICKET_TYPES,
  ticketStatusSchema,
} from '../types/ticket.js';
import { recordActivity } from './activityService.js';
import { createNotification } from './notificationService.js';
import { roleCan } from '../permissions/rules.js';
import { validateCustomFieldValues } from './customFieldService.js';
import { recordFieldChanges } from './fieldHistoryService.js';
import { assertIssueType, validateHierarchy } from './hierarchyService.js';
import { serializeIssue } from './issueSerialize.js';
import { nextBacklogRank } from './issueRankService.js';
import { getProjectForMember } from './projectService.js';

const createTicketSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(50_000).optional(),
  issueType: z.enum(ISSUE_TYPES).optional(),
  type: z.enum(TICKET_TYPES).optional(),
  severity: z.enum(TICKET_SEVERITIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().optional().nullable(),
  labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  components: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  storyPoints: z.number().min(0).max(1000).optional().nullable(),
  originalEstimateMinutes: z.number().int().min(0).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  parentId: z.string().optional().nullable(),
  epicLinkId: z.string().optional().nullable(),
  fixVersion: z.string().max(120).optional().nullable(),
  affectsVersions: z.array(z.string().max(120)).max(20).optional(),
  customFieldValues: z.record(z.unknown()).optional(),
  revision: z.number().int().optional(),
});

const updateTicketSchema = createTicketSchema.partial().extend({
  status: ticketStatusSchema.optional(),
  rank: z.string().min(1).max(200).optional(),
});

const listTicketsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: ticketStatusSchema.optional(),
  severity: z.enum(TICKET_SEVERITIES).optional(),
  assigneeId: z.string().optional(),
  label: z.string().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  q: z.string().trim().max(200).optional(),
});

const commentSchema = z.object({
  body: z.string().trim().min(1).max(20_000),
});

function resolveCreateType(data: z.infer<typeof createTicketSchema>): IssueType {
  if (data.issueType) return data.issueType;
  if (data.type) return assertIssueType(data.type);
  return 'task';
}

function resolveLegacyType(issueType: IssueType): (typeof TICKET_TYPES)[number] {
  if (issueType === 'bug') return 'bug';
  if (issueType === 'story') return 'feature';
  return 'task';
}

function resolvePriority(
  data: { priority?: Priority; severity?: (typeof TICKET_SEVERITIES)[number] },
): Priority {
  if (data.priority) return data.priority;
  if (data.severity) return severityToPriority(data.severity);
  return 'medium';
}

function resolveSeverity(priority: Priority): (typeof TICKET_SEVERITIES)[number] {
  const map: Record<Priority, (typeof TICKET_SEVERITIES)[number]> = {
    highest: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    lowest: 'low',
  };
  return map[priority];
}

async function nextTicketNumber(
  projectId: Types.ObjectId,
): Promise<{ number: number; prefix: string }> {
  const updated = await Project.findOneAndUpdate(
    { _id: projectId },
    { $inc: { ticketCounter: 1 } },
    { new: true },
  );
  if (!updated) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }
  return { number: updated.ticketCounter, prefix: updated.ticketKeyPrefix };
}

export async function createTicket(actor: UserDocument, projectId: string, input: unknown) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = createTicketSchema.parse(input);
  const projectObjectId = new Types.ObjectId(projectId);

  const issueType = resolveCreateType(data);
  const priority = resolvePriority(data);
  const severity = data.severity ?? resolveSeverity(priority);
  const parentId = data.parentId ? new Types.ObjectId(data.parentId) : null;
  const epicLinkId = data.epicLinkId ? new Types.ObjectId(data.epicLinkId) : null;

  await validateHierarchy({ projectId: projectObjectId, issueType, parentId, epicLinkId });

  const customFieldValues = data.customFieldValues
    ? await validateCustomFieldValues(projectObjectId, data.customFieldValues, { requireAllRequired: true })
    : await validateCustomFieldValues(projectObjectId, {}, { requireAllRequired: false });

  const { number, prefix } = await nextTicketNumber(projectObjectId);
  const displayKey = `${prefix}-${number}`;
  const description = sanitizeMarkdownInput(data.description ?? '');
  const rank = await nextBacklogRank(projectObjectId, null);

  let assigneeId: Types.ObjectId | null = null;
  if (data.assigneeId) {
    assigneeId = new Types.ObjectId(data.assigneeId);
  }

  const ticket = await Ticket.create({
    projectId: projectObjectId,
    number,
    displayKey,
    title: data.title,
    description,
    type: resolveLegacyType(issueType),
    issueType,
    severity,
    priority,
    status: 'backlog',
    assigneeId,
    reporterId: actor._id,
    labels: data.labels ?? [],
    components: data.components ?? [],
    fixVersion: data.fixVersion ?? null,
    affectsVersions: data.affectsVersions ?? [],
    storyPoints: data.storyPoints ?? null,
    originalEstimateMinutes: data.originalEstimateMinutes ?? null,
    timeSpentMinutes: 0,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    sprintId: null,
    epicLinkId,
    parentId,
    rank,
    revision: 0,
    customFieldValues,
    closedAt: null,
    resolvedAt: null,
  });

  await recordActivity({
    projectId: projectObjectId,
    ticketId: ticket._id,
    actorId: actor._id,
    action: 'ticket.created',
    changes: { displayKey: { from: null, to: displayKey } },
  });

  if (assigneeId && !assigneeId.equals(actor._id)) {
    await createNotification({
      userId: assigneeId,
      kind: 'assigned',
      ticketId: ticket._id,
      projectId: projectObjectId,
      message: `${actor.name} assigned you to ${displayKey}`,
    });
  }

  return serializeIssue(ticket);
}

export async function updateTicket(
  actor: UserDocument,
  projectId: string,
  ticketId: string,
  input: unknown,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = updateTicketSchema.parse(input);
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  if (data.revision !== undefined && data.revision !== ticket.revision) {
    throw new AppError('This issue was updated elsewhere. Reload and try again.', 409, 'VERSION_CONFLICT');
  }

  const reopenOnly =
    data.status !== undefined &&
    ticket.status === 'done' &&
    data.status !== 'done' &&
    Object.entries(data).every(([key, value]) => {
      if (key === 'status') return true;
      return value === undefined;
    });

  if (!roleCan(actor.role, 'ticket:edit')) {
    if (!(reopenOnly && roleCan(actor.role, 'ticket:reopen'))) {
      throw new AppError('You do not have permission to update this ticket', 403, 'FORBIDDEN');
    }
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (data.title !== undefined && data.title !== ticket.title) {
    changes.title = { from: ticket.title, to: data.title };
    ticket.title = data.title;
  }
  if (data.description !== undefined) {
    const sanitized = sanitizeMarkdownInput(data.description);
    if (sanitized !== ticket.description) {
      changes.description = { from: ticket.description, to: sanitized };
      ticket.description = sanitized;
    }
  }
  if (data.issueType !== undefined && data.issueType !== ticket.issueType) {
    await validateHierarchy({
      projectId: ticket.projectId,
      issueType: data.issueType,
      parentId: ticket.parentId,
      epicLinkId: ticket.epicLinkId,
      selfId: ticket._id,
    });
    changes.issueType = { from: ticket.issueType, to: data.issueType };
    ticket.issueType = data.issueType;
    ticket.type = resolveLegacyType(data.issueType);
  }
  if (data.type !== undefined && data.type !== ticket.type) {
    const issueType = assertIssueType(data.type);
    changes.type = { from: ticket.type, to: data.type };
    ticket.type = data.type;
    ticket.issueType = issueType;
  }
  if (data.priority !== undefined && data.priority !== ticket.priority) {
    changes.priority = { from: ticket.priority, to: data.priority };
    ticket.priority = data.priority;
    ticket.severity = resolveSeverity(data.priority);
  }
  if (data.severity !== undefined && data.severity !== ticket.severity) {
    changes.severity = { from: ticket.severity, to: data.severity };
    ticket.severity = data.severity;
    if (!data.priority) {
      ticket.priority = severityToPriority(data.severity);
    }
  }
  if (data.status !== undefined && data.status !== ticket.status) {
    changes.status = { from: ticket.status, to: data.status };
    ticket.status = data.status;
    if (data.status === 'done') {
      const now = new Date();
      ticket.closedAt = now;
      ticket.resolvedAt = now;
    } else if (ticket.closedAt) {
      ticket.closedAt = null;
      ticket.resolvedAt = null;
    }
  }
  if (data.rank !== undefined && data.rank !== ticket.rank) {
    changes.rank = { from: ticket.rank, to: data.rank };
    ticket.rank = data.rank;
  }
  if (data.storyPoints !== undefined) {
    changes.storyPoints = { from: ticket.storyPoints, to: data.storyPoints };
    ticket.storyPoints = data.storyPoints;
  }
  if (data.components !== undefined) {
    changes.components = { from: ticket.components, to: data.components };
    ticket.components = data.components;
  }
  if (data.customFieldValues !== undefined) {
    const validated = await validateCustomFieldValues(ticket.projectId, data.customFieldValues);
    changes.customFieldValues = { from: ticket.customFieldValues, to: validated };
    ticket.customFieldValues = validated;
  }
  if (data.parentId !== undefined || data.epicLinkId !== undefined) {
    const parentId = data.parentId ? new Types.ObjectId(data.parentId) : null;
    const epicLinkId = data.epicLinkId ? new Types.ObjectId(data.epicLinkId) : null;
    await validateHierarchy({
      projectId: ticket.projectId,
      issueType: ticket.issueType,
      parentId,
      epicLinkId,
      selfId: ticket._id,
    });
    if (data.parentId !== undefined) {
      changes.parentId = { from: ticket.parentId, to: parentId };
      ticket.parentId = parentId;
    }
    if (data.epicLinkId !== undefined) {
      changes.epicLinkId = { from: ticket.epicLinkId, to: epicLinkId };
      ticket.epicLinkId = epicLinkId;
    }
  }
  if (data.labels !== undefined) {
    changes.labels = { from: ticket.labels, to: data.labels };
    ticket.labels = data.labels;
  }
  if (data.dueDate !== undefined) {
    const due = data.dueDate ? new Date(data.dueDate) : null;
    changes.dueDate = { from: ticket.dueDate, to: due };
    ticket.dueDate = due;
  }
  if (data.assigneeId !== undefined) {
    const assigneeId = data.assigneeId ? new Types.ObjectId(data.assigneeId) : null;
    changes.assigneeId = { from: ticket.assigneeId, to: assigneeId };
    ticket.assigneeId = assigneeId;
    if (assigneeId && !assigneeId.equals(actor._id)) {
      await createNotification({
        userId: assigneeId,
        kind: 'assigned',
        ticketId: ticket._id,
        projectId: ticket.projectId,
        message: `${actor.name} assigned you to ${ticket.displayKey}`,
      });
    }
  }

  ticket.revision += 1;
  await ticket.save();

  if (Object.keys(changes).length > 0) {
    await recordActivity({
      projectId: ticket.projectId,
      ticketId: ticket._id,
      actorId: actor._id,
      action: 'ticket.updated',
      changes,
    });
    await recordFieldChanges({
      projectId: ticket.projectId,
      issueId: ticket._id,
      actorId: actor._id,
      changes,
    });
  }

  if (changes.status && ticket.assigneeId) {
    await createNotification({
      userId: ticket.assigneeId,
      kind: 'status_changed',
      ticketId: ticket._id,
      projectId: ticket.projectId,
      message: `${ticket.displayKey} moved to ${ticket.status.replace('_', ' ')}`,
    });
  }

  return serializeIssue(ticket);
}

export async function deleteTicket(actor: UserDocument, projectId: string, ticketId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }
  await Comment.deleteMany({ ticketId: ticket._id });
  await Ticket.deleteOne({ _id: ticket._id });
  await recordActivity({
    projectId: ticket.projectId,
    ticketId: null,
    actorId: actor._id,
    action: 'ticket.deleted',
    changes: { displayKey: { from: ticket.displayKey, to: null } },
  });
}

export async function listTickets(actor: UserDocument, projectId: string, queryInput: unknown) {
  await getProjectForMember(projectId, actor._id.toString());
  const query = listTicketsSchema.parse(queryInput);

  const filter: Record<string, unknown> = { projectId: new Types.ObjectId(projectId) };
  if (query.status) filter.status = query.status;
  if (query.severity) filter.severity = query.severity;
  if (query.assigneeId) filter.assigneeId = new Types.ObjectId(query.assigneeId);
  if (query.label) filter.labels = query.label;
  if (query.dueBefore || query.dueAfter) {
    const dueFilter: { $lte?: Date; $gte?: Date } = {};
    if (query.dueBefore) dueFilter.$lte = new Date(query.dueBefore);
    if (query.dueAfter) dueFilter.$gte = new Date(query.dueAfter);
    filter.dueDate = dueFilter;
  }
  if (query.q) {
    filter.$text = { $search: query.q };
  }
  if (query.cursor) {
    filter._id = { $lt: new Types.ObjectId(query.cursor) };
  }

  const tickets = await Ticket.find(filter)
    .sort(query.q ? { score: { $meta: 'textScore' }, _id: -1 } : { _id: -1 })
    .limit(query.limit + 1);

  const hasMore = tickets.length > query.limit;
  const slice = hasMore ? tickets.slice(0, query.limit) : tickets;
  const nextCursor = hasMore ? slice[slice.length - 1]?._id.toString() : null;

  return {
    items: slice.map(serializeIssue),
    nextCursor,
  };
}

function extractMentionNames(body: string): string[] {
  const pattern = /@([a-zA-Z0-9][a-zA-Z0-9 ._-]{0,60})/g;
  const names = new Set<string>();
  let match = pattern.exec(body);
  while (match) {
    if (match[1]) {
      names.add(match[1].trim().toLowerCase());
    }
    match = pattern.exec(body);
  }
  return [...names];
}

export async function addComment(
  actor: UserDocument,
  projectId: string,
  ticketId: string,
  input: unknown,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = commentSchema.parse(input);
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  const body = sanitizeMarkdownInput(data.body);
  const comment = await Comment.create({
    ticketId: ticket._id,
    authorId: actor._id,
    body,
  });

  await recordActivity({
    projectId: ticket.projectId,
    ticketId: ticket._id,
    actorId: actor._id,
    action: 'ticket.comment_added',
  });

  const mentionNames = extractMentionNames(body);
  if (mentionNames.length > 0) {
    const members = await User.find({
      $or: mentionNames.map((name) => ({
        name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      })),
    });
    for (const member of members) {
      if (member._id.equals(actor._id)) continue;
      await createNotification({
        userId: member._id,
        kind: 'mentioned',
        ticketId: ticket._id,
        projectId: ticket.projectId,
        message: `${actor.name} mentioned you on ${ticket.displayKey}`,
      });
    }
  }

  return formatComment(comment);
}

function formatComment(comment: InstanceType<typeof Comment>) {
  return {
    id: comment._id.toString(),
    ticketId: comment.ticketId.toString(),
    authorId: comment.authorId.toString(),
    body: comment.deletedAt ? '' : comment.body,
    deletedAt: comment.deletedAt?.toISOString() ?? null,
    editHistory: comment.editHistory.map((revision) => ({
      body: revision.body,
      editedAt: revision.editedAt.toISOString(),
      editedBy: revision.editedBy.toString(),
    })),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

function assertCommentAuthor(actor: UserDocument, comment: InstanceType<typeof Comment>) {
  if (!comment.authorId.equals(actor._id) && actor.role !== 'admin') {
    throw new AppError('Only the author may change this comment', 403, 'FORBIDDEN');
  }
}

export async function listComments(actor: UserDocument, projectId: string, ticketId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }
  const comments = await Comment.find({ ticketId }).sort({ createdAt: 1 });
  return comments.map((comment) => formatComment(comment));
}

export async function editComment(
  actor: UserDocument,
  projectId: string,
  ticketId: string,
  commentId: string,
  input: unknown,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }
  const data = commentSchema.parse(input);
  const comment = await Comment.findOne({ _id: commentId, ticketId });
  if (!comment || comment.deletedAt) {
    throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  assertCommentAuthor(actor, comment);

  const nextBody = sanitizeMarkdownInput(data.body);
  if (nextBody !== comment.body) {
    comment.editHistory.push({
      body: comment.body,
      editedAt: new Date(),
      editedBy: actor._id,
    });
    comment.body = nextBody;
    await comment.save();
  }

  return formatComment(comment);
}

export async function deleteComment(
  actor: UserDocument,
  projectId: string,
  ticketId: string,
  commentId: string,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }
  const comment = await Comment.findOne({ _id: commentId, ticketId });
  if (!comment || comment.deletedAt) {
    throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
  }
  assertCommentAuthor(actor, comment);
  comment.deletedAt = new Date();
  await comment.save();
  return formatComment(comment);
}

export async function getTicket(actor: UserDocument, projectId: string, ticketId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const ticket = await Ticket.findOne({ _id: ticketId, projectId });
  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }
  return serializeIssue(ticket);
}

export async function bulkUpdateTickets(
  actor: UserDocument,
  projectId: string,
  input: unknown,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const schema = z.object({
    issueIds: z.array(z.string()).min(1).max(100),
    patch: updateTicketSchema,
  });
  const data = schema.parse(input);

  const results: Array<{ issueId: string; ok: boolean; error?: string }> = [];
  for (const issueId of data.issueIds) {
    try {
      await updateTicket(actor, projectId, issueId, data.patch);
      results.push({ issueId, ok: true });
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Update failed';
      results.push({ issueId, ok: false, error: message });
    }
  }

  return {
    succeeded: results.filter((row) => row.ok).length,
    failed: results.filter((row) => !row.ok).length,
    results,
  };
}
