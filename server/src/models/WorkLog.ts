import mongoose, { Schema, type Types } from 'mongoose';

export interface WorkLogDoc extends mongoose.Document {
  _id: Types.ObjectId;
  issueId: Types.ObjectId;
  projectId: Types.ObjectId;
  authorId: Types.ObjectId;
  timeSpentMinutes: number;
  note: string;
  startedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workLogSchema = new Schema<WorkLogDoc>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timeSpentMinutes: { type: Number, required: true, min: 1, max: 60 * 24 * 14 },
    note: { type: String, default: '', maxlength: 2000 },
    startedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const WorkLog = mongoose.model<WorkLogDoc>('WorkLog', workLogSchema);
