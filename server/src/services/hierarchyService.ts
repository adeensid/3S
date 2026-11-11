import { Types } from 'mongoose';
import { AppError } from '../lib/errors.js';
import { Ticket } from '../models/Ticket.js';
import {
  ISSUE_TYPES,
  type IssueType,
  PARENT_TYPES,
  ROOT_TYPES,
  issueTypeSchema,
  normalizeLegacyType,
} from '../types/issue.js';

export function assertIssueType(value: string): IssueType {
  const normalized = normalizeLegacyType(value);
  const parsed = issueTypeSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new AppError('Invalid issue type', 400, 'INVALID_ISSUE_TYPE');
  }
  return parsed.data;
}

export async function validateHierarchy(params: {
  projectId: Types.ObjectId;
  issueType: IssueType;
  parentId: Types.ObjectId | null;
  epicLinkId: Types.ObjectId | null;
  selfId?: Types.ObjectId;
}): Promise<void> {
  const { projectId, issueType, parentId, epicLinkId, selfId } = params;

  if (issueType === 'epic') {
    if (parentId) {
      throw new AppError('Epics cannot have a parent issue', 400, 'INVALID_PARENT');
    }
    if (epicLinkId) {
      throw new AppError('Epics cannot link to another epic', 400, 'INVALID_EPIC_LINK');
    }
    return;
  }

  if (issueType === 'sub_task') {
    if (!parentId) {
      throw new AppError('Sub-tasks require a parent issue', 400, 'PARENT_REQUIRED');
    }
    const parent = await Ticket.findOne({ _id: parentId, projectId });
    if (!parent) {
      throw new AppError('Parent issue not found in this project', 404, 'PARENT_NOT_FOUND');
    }
    const parentType = assertIssueType(parent.issueType ?? parent.type);
    if (!PARENT_TYPES.includes(parentType)) {
      throw new AppError('Sub-tasks can only attach to story, task, or bug', 400, 'INVALID_PARENT');
    }
    if (epicLinkId && epicLinkId.equals(parentId)) {
      throw new AppError('Epic link cannot equal parent', 400, 'INVALID_EPIC_LINK');
    }
    return;
  }

  if (!ROOT_TYPES.includes(issueType)) {
    throw new AppError('Unsupported issue type', 400, 'INVALID_ISSUE_TYPE');
  }

  if (parentId) {
    throw new AppError('Only sub-tasks can have a parent issue', 400, 'INVALID_PARENT');
  }

  if (epicLinkId) {
    if (selfId && epicLinkId.equals(selfId)) {
      throw new AppError('Issue cannot link to itself as an epic', 400, 'INVALID_EPIC_LINK');
    }
    const epic = await Ticket.findOne({ _id: epicLinkId, projectId });
    if (!epic) {
      throw new AppError('Epic not found in this project', 404, 'EPIC_NOT_FOUND');
    }
    const epicType = assertIssueType(epic.issueType ?? epic.type);
    if (epicType !== 'epic') {
      throw new AppError('epicLinkId must reference an epic', 400, 'INVALID_EPIC_LINK');
    }
  }
}

export function isValidIssueType(value: unknown): value is IssueType {
  return typeof value === 'string' && ISSUE_TYPES.includes(value as IssueType);
}
