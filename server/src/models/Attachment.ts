import mongoose, { Schema, type Types } from 'mongoose';

export interface AttachmentDoc extends mongoose.Document {
  _id: Types.ObjectId;
  issueId: Types.ObjectId;
  projectId: Types.ObjectId;
  uploaderId: Types.ObjectId;
  originalName: string;
  safeName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: Date;
}

const attachmentSchema = new Schema<AttachmentDoc>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    safeName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 1, max: 20 * 1024 * 1024 },
    storageKey: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Attachment = mongoose.model<AttachmentDoc>('Attachment', attachmentSchema);
