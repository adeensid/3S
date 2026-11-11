import bcrypt from 'bcryptjs';
import mongoose, { type HydratedDocument, Schema, type Types } from 'mongoose';
import { type Role, ROLES } from '../types/roles.js';
import { loadEnv } from '../config/env.js';

export interface UserAttrs {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  tokenVersion: number;
  failedLoginAttempts: number;
  lockUntil: Date | null;
}

export interface UserDoc extends UserAttrs, mongoose.Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isLocked(): boolean;
  comparePassword(plain: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES },
    tokenVersion: { type: Number, required: true, default: 0 },
    failedLoginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.methods.isLocked = function isLocked(this: UserDoc): boolean {
  return this.lockUntil instanceof Date && this.lockUntil.getTime() > Date.now();
};

userSchema.methods.comparePassword = async function comparePassword(
  this: UserDoc,
  plain: string,
): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain: string): Promise<string> {
  const env = loadEnv();
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
};

export type UserModel = mongoose.Model<UserDoc> & {
  hashPassword(plain: string): Promise<string>;
};

export const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export type UserDocument = HydratedDocument<UserDoc>;
