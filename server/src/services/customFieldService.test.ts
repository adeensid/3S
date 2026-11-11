import { Types } from 'mongoose';
import { CustomFieldDefinition } from '../models/CustomFieldDefinition.js';
import { validateCustomFieldValues } from './customFieldService.js';
import { connectTestDatabase, clearDatabase, disconnectTestDatabase } from '../test/mongoSetup.js';

describe('customFieldService', () => {
  const projectId = new Types.ObjectId();

  beforeAll(async () => {
    process.env.MONGOMS_DISABLED = '1';
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await CustomFieldDefinition.create({
      projectId,
      key: 'environment',
      name: 'Environment',
      fieldType: 'select',
      options: ['staging', 'production'],
      required: true,
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('accepts valid select values', async () => {
    const values = await validateCustomFieldValues(projectId, { environment: 'staging' });
    expect(values.environment).toBe('staging');
  });

  it('rejects values outside configured options', async () => {
    await expect(validateCustomFieldValues(projectId, { environment: 'qa' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});
