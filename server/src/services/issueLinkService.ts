import { Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { IssueLink } from '../models/IssueLink.js';
import { Ticket } from '../models/Ticket.js';
import { issueLinkTypeSchema } from '../types/issue.js';
import { getProjectForMember } from './projectService.js';
import type { UserDocument } from '../models/User.js';

const createLinkSchema = z.object({
  targetIssueId: z.string(),
  linkType: issueLinkTypeSchema,
});

const inverseType: Record<string, string> = {
  blocks: 'is_blocked_by',
  is_blocked_by: 'blocks',
  relates_to: 'relates_to',
  duplicates: 'duplicates',
};

export async function createIssueLink(
  actor: UserDocument,
  projectId: string,
  sourceIssueId: string,
  input: unknown,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = createLinkSchema.parse(input);

  if (sourceIssueId === data.targetIssueId) {
    throw new AppError('An issue cannot link to itself', 400, 'SELF_LINK');
  }

  const [source, target] = await Promise.all([
    Ticket.findOne({ _id: sourceIssueId, projectId }),
    Ticket.findOne({ _id: data.targetIssueId, projectId }),
  ]);

  if (!source || !target) {
    throw new AppError('Source or target issue was not found in this project', 404, 'ISSUE_NOT_FOUND');
  }

  const link = await IssueLink.create({
    projectId: new Types.ObjectId(projectId),
    sourceIssueId: source._id,
    targetIssueId: target._id,
    linkType: data.linkType,
    createdBy: actor._id,
  });

  const inverse = inverseType[data.linkType];
  if (inverse && inverse !== data.linkType) {
    await IssueLink.updateOne(
      {
        projectId: new Types.ObjectId(projectId),
        sourceIssueId: target._id,
        targetIssueId: source._id,
        linkType: inverse,
      },
      {
        $setOnInsert: {
          projectId: new Types.ObjectId(projectId),
          sourceIssueId: target._id,
          targetIssueId: source._id,
          linkType: inverse,
          createdBy: actor._id,
        },
      },
      { upsert: true },
    );
  }

  return serializeLink(link, source.displayKey, target.displayKey);
}

export async function listIssueLinks(actor: UserDocument, projectId: string, issueId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const issue = await Ticket.findOne({ _id: issueId, projectId });
  if (!issue) {
    throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
  }

  const links = await IssueLink.find({
    projectId,
    $or: [{ sourceIssueId: issue._id }, { targetIssueId: issue._id }],
  }).sort({ createdAt: -1 });

  const relatedIds = new Set<string>();
  for (const link of links) {
    relatedIds.add(link.sourceIssueId.toString());
    relatedIds.add(link.targetIssueId.toString());
  }

  const relatedIssues = await Ticket.find({ _id: { $in: [...relatedIds] } }).select('displayKey');
  const keys = new Map(relatedIssues.map((row) => [row._id.toString(), row.displayKey]));

  return links.map((link) =>
    serializeLink(
      link,
      keys.get(link.sourceIssueId.toString()) ?? 'unknown',
      keys.get(link.targetIssueId.toString()) ?? 'unknown',
    ),
  );
}

export async function listBlockingWarnings(projectId: string, issueId: string): Promise<string[]> {
  const blockedBy = await IssueLink.find({
    projectId,
    targetIssueId: issueId,
    linkType: 'blocks',
  }).populate<{ sourceIssueId: { displayKey: string } }>('sourceIssueId', 'displayKey');

  return blockedBy.map((link) => {
    const key =
      typeof link.sourceIssueId === 'object' && link.sourceIssueId !== null && 'displayKey' in link.sourceIssueId
        ? String((link.sourceIssueId as { displayKey: string }).displayKey)
        : 'Unknown issue';
    return `${key} blocks this issue`;
  });
}

function serializeLink(
  link: {
    _id: Types.ObjectId;
    sourceIssueId: Types.ObjectId;
    targetIssueId: Types.ObjectId;
    linkType: string;
    createdAt: Date;
  },
  sourceKey: string,
  targetKey: string,
) {
  return {
    id: link._id.toString(),
    linkType: link.linkType,
    sourceIssueId: link.sourceIssueId.toString(),
    targetIssueId: link.targetIssueId.toString(),
    sourceKey,
    targetKey,
    createdAt: link.createdAt.toISOString(),
  };
}
