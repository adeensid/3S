import mongoose, { Schema, type Types } from 'mongoose';

export interface FieldHistoryDoc extends mongoose.Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  issueId: Types.ObjectId;
  actorId: Types.ObjectId;
  fieldName: string;
  fromValue: unknown;
  toValue: unknown;
  createdAt: Date;
}

const fieldHistorySchema = new Schema<FieldHistoryDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    issueId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fieldName: { type: String, required: true },
    fromValue: { type: Schema.Types.Mixed, default: null },
    toValue: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

fieldHistorySchema.index({ issueId: 1, createdAt: -1 });

export const FieldHistory = mongoose.model<FieldHistoryDoc>('FieldHistory', fieldHistorySchema);
