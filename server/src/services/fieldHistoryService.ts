import type { Types } from 'mongoose';
import { FieldHistory } from '../models/FieldHistory.js';

export async function recordFieldChanges(params: {
  projectId: Types.ObjectId;
  issueId: Types.ObjectId;
  actorId: Types.ObjectId;
  changes: Record<string, { from: unknown; to: unknown }>;
}): Promise<void> {
  const entries = Object.entries(params.changes);
  if (entries.length === 0) return;

  await FieldHistory.insertMany(
    entries.map(([fieldName, change]) => ({
      projectId: params.projectId,
      issueId: params.issueId,
      actorId: params.actorId,
      fieldName,
      fromValue: change.from,
      toValue: change.to,
    })),
  );
}

export async function listFieldHistory(issueId: string) {
  const rows = await FieldHistory.find({ issueId }).sort({ createdAt: -1 }).limit(200);
  return rows.map((row) => ({
    id: row._id.toString(),
    fieldName: row.fieldName,
    fromValue: row.fromValue,
    toValue: row.toValue,
    actorId: row.actorId.toString(),
    createdAt: row.createdAt.toISOString(),
  }));
}
