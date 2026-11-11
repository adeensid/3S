import mongoose, { Schema, type Types } from 'mongoose';
import { customFieldTypeSchema, type CustomFieldType } from '../types/issue.js';

export interface CustomFieldDefinitionDoc extends mongoose.Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  key: string;
  name: string;
  fieldType: CustomFieldType;
  options: string[];
  required: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customFieldSchema = new Schema<CustomFieldDefinitionDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    key: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z][a-z0-9_]{1,40}$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    fieldType: { type: String, required: true, enum: customFieldTypeSchema.options },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
  },
  { timestamps: true },
);

customFieldSchema.index({ projectId: 1, key: 1 }, { unique: true });

export const CustomFieldDefinition = mongoose.model<CustomFieldDefinitionDoc>(
  'CustomFieldDefinition',
  customFieldSchema,
);
