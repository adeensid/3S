import mongoose, { Schema, type Types } from 'mongoose';

export type NotificationKind = 'assigned' | 'mentioned' | 'status_changed';

export interface NotificationDoc extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  kind: NotificationKind;
  ticketId: Types.ObjectId;
  projectId: Types.ObjectId;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification = mongoose.model<NotificationDoc>('Notification', notificationSchema);
