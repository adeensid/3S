import mongoose, { Schema, type Types } from 'mongoose';

export interface RefreshSessionDoc extends mongoose.Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<RefreshSessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession = mongoose.model<RefreshSessionDoc>(
  'RefreshSession',
  refreshSessionSchema,
);
