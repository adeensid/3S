import mongoose, { Schema, type Types } from 'mongoose';

export interface ActivityLogDoc extends mongoose.Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  ticketId: Types.ObjectId | null;
  actorId: Types.ObjectId;
  action: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityLogDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', default: null, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ActivityLog = mongoose.model<ActivityLogDoc>('ActivityLog', activitySchema);
