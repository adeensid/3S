import mongoose, { Schema, type Types } from 'mongoose';
import { issueLinkTypeSchema, type IssueLinkType } from '../types/issue.js';

export interface IssueLinkDoc extends mongoose.Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sourceIssueId: Types.ObjectId;
  targetIssueId: Types.ObjectId;
  linkType: IssueLinkType;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const issueLinkSchema = new Schema<IssueLinkDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sourceIssueId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    targetIssueId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    linkType: { type: String, required: true, enum: issueLinkTypeSchema.options },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

issueLinkSchema.index({ projectId: 1, sourceIssueId: 1, targetIssueId: 1, linkType: 1 }, { unique: true });

export const IssueLink = mongoose.model<IssueLinkDoc>('IssueLink', issueLinkSchema);
