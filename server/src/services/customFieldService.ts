import { Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { CustomFieldDefinition } from '../models/CustomFieldDefinition.js';
import { customFieldTypeSchema } from '../types/issue.js';
import { getProjectForMember } from './projectService.js';
import type { UserDocument } from '../models/User.js';

const createFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z][a-z0-9_]{1,40}$/),
  name: z.string().trim().min(1).max(120),
  fieldType: customFieldTypeSchema,
  options: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  required: z.boolean().optional(),
});

const setValueSchema = z.record(z.unknown());

export async function listCustomFields(actor: UserDocument, projectId: string) {
  await getProjectForMember(projectId, actor._id.toString());
  const fields = await CustomFieldDefinition.find({ projectId }).sort({ name: 1 });
  return fields.map((field) => ({
    id: field._id.toString(),
    key: field.key,
    name: field.name,
    fieldType: field.fieldType,
    options: field.options,
    required: field.required,
  }));
}

export async function createCustomField(actor: UserDocument, projectId: string, input: unknown) {
  await getProjectForMember(projectId, actor._id.toString());
  const data = createFieldSchema.parse(input);

  if (
    (data.fieldType === 'select' || data.fieldType === 'multi_select') &&
    (!data.options || data.options.length === 0)
  ) {
    throw new AppError('Select fields require at least one option', 400, 'OPTIONS_REQUIRED');
  }

  try {
    const created = await CustomFieldDefinition.create({
      projectId: new Types.ObjectId(projectId),
      key: data.key,
      name: data.name,
      fieldType: data.fieldType,
      options: data.options ?? [],
      required: data.required ?? false,
    });
    return {
      id: created._id.toString(),
      key: created.key,
      name: created.name,
      fieldType: created.fieldType,
      options: created.options,
      required: created.required,
    };
  } catch {
    throw new AppError('A custom field with this key already exists', 409, 'FIELD_KEY_TAKEN');
  }
}

export async function validateCustomFieldValues(
  projectId: Types.ObjectId,
  values: Record<string, unknown>,
  options?: { requireAllRequired?: boolean },
): Promise<Record<string, unknown>> {
  const parsed = setValueSchema.parse(values);
  const definitions = await CustomFieldDefinition.find({ projectId });
  const byKey = new Map(definitions.map((def) => [def.key, def]));

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(parsed)) {
    const definition = byKey.get(key);
    if (!definition) {
      throw new AppError(`Unknown custom field: ${key}`, 400, 'UNKNOWN_CUSTOM_FIELD');
    }

    switch (definition.fieldType) {
      case 'text':
        if (typeof value !== 'string') {
          throw new AppError(`${key} must be text`, 400, 'VALIDATION_ERROR');
        }
        output[key] = value.slice(0, 2000);
        break;
      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new AppError(`${key} must be a number`, 400, 'VALIDATION_ERROR');
        }
        output[key] = value;
        break;
      case 'select':
        if (typeof value !== 'string' || !definition.options.includes(value)) {
          throw new AppError(`${key} must be one of the configured options`, 400, 'VALIDATION_ERROR');
        }
        output[key] = value;
        break;
      case 'multi_select':
        if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
          throw new AppError(`${key} must be a string array`, 400, 'VALIDATION_ERROR');
        }
        if (!value.every((item) => definition.options.includes(item))) {
          throw new AppError(`${key} contains invalid option`, 400, 'VALIDATION_ERROR');
        }
        output[key] = value;
        break;
      case 'date':
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
          throw new AppError(`${key} must be an ISO date string`, 400, 'VALIDATION_ERROR');
        }
        output[key] = value;
        break;
      case 'user':
        if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
          throw new AppError(`${key} must be a user id`, 400, 'VALIDATION_ERROR');
        }
        output[key] = value;
        break;
      default:
        break;
    }
  }

  const requireAll = options?.requireAllRequired ?? true;
  if (requireAll) {
    for (const definition of definitions) {
      if (definition.required && output[definition.key] === undefined) {
        throw new AppError(`Required custom field missing: ${definition.key}`, 400, 'VALIDATION_ERROR');
      }
    }
  }

  return output;
}
