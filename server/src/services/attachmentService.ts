import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { Attachment } from '../models/Attachment.js';
import { Ticket } from '../models/Ticket.js';
import { AppError } from '../lib/errors.js';
import { sanitizeAttachmentFilename } from '../lib/safeFilename.js';
import { getProjectForMember } from './projectService.js';
import type { UserDocument } from '../models/User.js';

const MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/json',
]);

const registerSchema = z.object({
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().min(1).max(MAX_BYTES),
});

export async function listAttachments(
  actor: UserDocument,
  projectId: string,
  issueId: string,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const issue = await Ticket.findOne({ _id: issueId, projectId });
  if (!issue) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }
  const rows = await Attachment.find({ issueId, projectId }).sort({ createdAt: -1 });
  return rows.map((row) => ({
    id: row._id.toString(),
    issueId: row.issueId.toString(),
    originalName: row.originalName,
    safeName: row.safeName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function registerAttachment(
  actor: UserDocument,
  projectId: string,
  issueId: string,
  input: unknown,
) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = registerSchema.parse(input);
  if (!ALLOWED_MIME.has(data.mimeType)) {
    throw new AppError('Attachment type is not allowed', 400, 'ATTACHMENT_TYPE_DENIED');
  }

  const issue = await Ticket.findOne({ _id: issueId, projectId });
  if (!issue) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  const safeName = sanitizeAttachmentFilename(data.originalName);
  const token = randomBytes(12).toString('hex');
  const storageKey = `issues/${issue._id.toString()}/${token}_${safeName}`;

  const attachment = await Attachment.create({
    issueId: issue._id,
    projectId: issue.projectId,
    uploaderId: actor._id,
    originalName: data.originalName,
    safeName,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
    storageKey,
  });

  return {
    id: attachment._id.toString(),
    issueId: issue._id.toString(),
    originalName: attachment.originalName,
    safeName: attachment.safeName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    createdAt: attachment.createdAt.toISOString(),
  };
}
