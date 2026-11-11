import mongoose, { Schema, type Types } from 'mongoose';

export interface WatcherDoc extends mongoose.Document {
  _id: Types.ObjectId;
  issueId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const watcherSchema = new Schema<WatcherDoc>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

watcherSchema.index({ issueId: 1, userId: 1 }, { unique: true });

export const Watcher = mongoose.model<WatcherDoc>('Watcher', watcherSchema);
