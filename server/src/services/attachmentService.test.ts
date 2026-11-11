import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { registerAttachment } from './attachmentService.js';
import { connectTestDatabase, clearDatabase, disconnectTestDatabase } from '../test/mongoSetup.js';

describe('attachmentService', () => {
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

  it('rejects disallowed mime types', async () => {
    const actor = await User.create({
      email: 'attach@sid.example',
      name: 'Attach',
      passwordHash: await User.hashPassword('Password10'),
      role: 'admin',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    const project = await Project.create({
      name: 'Attachments',
      ticketKeyPrefix: 'ATT',
      description: '',
      archivedAt: null,
      members: [{ userId: actor._id, joinedAt: new Date() }],
      createdBy: actor._id,
      ticketCounter: 0,
    });
    const projectId = project._id;

    const issue = await Ticket.create({
      projectId,
      number: 1,
      displayKey: 'SID-1',
      title: 'Issue',
      description: '',
      type: 'task',
      issueType: 'task',
      severity: 'medium',
      priority: 'medium',
      status: 'backlog',
      assigneeId: null,
      reporterId: actor._id,
      labels: [],
      components: [],
      rank: '0|m:',
      revision: 0,
    });

    await expect(
      registerAttachment(actor, projectId.toString(), issue._id.toString(), {
        originalName: 'payload.exe',
        mimeType: 'application/x-msdownload',
        sizeBytes: 10,
      }),
    ).rejects.toMatchObject({ code: 'ATTACHMENT_TYPE_DENIED' });
  });
});
