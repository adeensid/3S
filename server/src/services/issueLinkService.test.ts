import { Types } from 'mongoose';
import { IssueLink } from '../models/IssueLink.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { createIssueLink, listBlockingWarnings } from './issueLinkService.js';
import { connectTestDatabase, clearDatabase, disconnectTestDatabase } from '../test/mongoSetup.js';

describe('issueLinkService', () => {
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

  it('creates inverse blocked-by links for blocks relationships', async () => {
    const actor = await User.create({
      email: 'linker@sid.example',
      name: 'Linker',
      passwordHash: await User.hashPassword('Password10'),
      role: 'admin',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    const project = await Project.create({
      name: 'Links',
      ticketKeyPrefix: 'LNK',
      description: '',
      archivedAt: null,
      members: [{ userId: actor._id, joinedAt: new Date() }],
      createdBy: actor._id,
      ticketCounter: 0,
    });
    const projectId = project._id;

    const issueA = await Ticket.create({
      projectId,
      number: 1,
      displayKey: 'SID-1',
      title: 'Blocker',
      description: '',
      type: 'bug',
      issueType: 'bug',
      severity: 'high',
      priority: 'high',
      status: 'backlog',
      assigneeId: null,
      reporterId: actor._id,
      labels: [],
      components: [],
      rank: '0|a:',
      revision: 0,
    });

    const issueB = await Ticket.create({
      projectId,
      number: 2,
      displayKey: 'SID-2',
      title: 'Blocked',
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
      rank: '0|b:',
      revision: 0,
    });

    await createIssueLink(actor, projectId.toString(), issueA._id.toString(), {
      targetIssueId: issueB._id.toString(),
      linkType: 'blocks',
    });

    const inverse = await IssueLink.findOne({
      sourceIssueId: issueB._id,
      targetIssueId: issueA._id,
      linkType: 'is_blocked_by',
    });
    expect(inverse).not.toBeNull();

    const warnings = await listBlockingWarnings(projectId.toString(), issueB._id.toString());
    expect(warnings[0]).toContain('SID-1');
  });
});
