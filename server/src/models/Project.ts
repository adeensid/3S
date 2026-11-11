import mongoose, { Schema, type Types } from 'mongoose';

export interface ProjectMember {
  userId: Types.ObjectId;
  joinedAt: Date;
}

export interface ProjectDoc extends mongoose.Document {
  _id: Types.ObjectId;
  name: string;
  ticketKeyPrefix: string;
  description: string;
  archivedAt: Date | null;
  members: ProjectMember[];
  createdBy: Types.ObjectId;
  ticketCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<ProjectMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const projectSchema = new Schema<ProjectDoc>(
  {
    name: { type: String, required: true, trim: true },
    ticketKeyPrefix: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 8,
      unique: true,
    },
    description: { type: String, default: '', trim: true },
    archivedAt: { type: Date, default: null, index: true },
    members: { type: [memberSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketCounter: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

projectSchema.index({ name: 'text', description: 'text' });

export const Project = mongoose.model<ProjectDoc>('Project', projectSchema);
