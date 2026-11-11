import { Types } from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { assertIssueType, validateHierarchy } from './hierarchyService.js';
import { connectTestDatabase, clearDatabase, disconnectTestDatabase } from '../test/mongoSetup.js';

describe('hierarchyService', () => {
  beforeAll(async () => {
    process.env.MONGOMS_DISABLED = '1';
    await connectTestDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('normalizes legacy feature type to story', () => {
    expect(assertIssueType('feature')).toBe('story');
  });

  it('enforces sub-task parent rules', async () => {
    const projectId = new Types.ObjectId();
    const story = await Ticket.create({
      projectId,
      number: 1,
      displayKey: 'SID-1',
      title: 'Story',
      description: '',
      type: 'task',
      issueType: 'story',
      severity: 'medium',
      priority: 'medium',
      status: 'backlog',
      assigneeId: null,
      reporterId: new Types.ObjectId(),
      labels: [],
      rank: '0|m:',
      revision: 0,
    });

    await expect(
      validateHierarchy({
        projectId,
        issueType: 'sub_task',
        parentId: story._id,
        epicLinkId: null,
      }),
    ).resolves.toBeUndefined();

    await expect(
      validateHierarchy({
        projectId,
        issueType: 'sub_task',
        parentId: null,
        epicLinkId: null,
      }),
    ).rejects.toMatchObject({ code: 'PARENT_REQUIRED' });
  });

  it('rejects epic links that are not epics', async () => {
    const projectId = new Types.ObjectId();
    const task = await Ticket.create({
      projectId,
      number: 2,
      displayKey: 'SID-2',
      title: 'Plain task',
      description: '',
      type: 'task',
      issueType: 'task',
      severity: 'medium',
      priority: 'medium',
      status: 'backlog',
      assigneeId: null,
      reporterId: new Types.ObjectId(),
      labels: [],
      rank: '0|n:',
      revision: 0,
    });

    await expect(
      validateHierarchy({
        projectId,
        issueType: 'story',
        parentId: null,
        epicLinkId: task._id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EPIC_LINK' });
  });
});
