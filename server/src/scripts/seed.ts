import mongoose from 'mongoose';
import { loadEnv, resetEnvCache } from '../config/env.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Ticket } from '../models/Ticket.js';
import { Comment } from '../models/Comment.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { logger } from '../lib/logger.js';
import { rankAfter, initialRank } from '../lib/lexorank.js';
import { severityToPriority, type IssueType } from '../types/issue.js';

const ticketTitles = [
  'Refresh token not rotated after password change',
  'Board column count wrong after archiving a ticket',
  'Due date filter excludes tickets due today',
  'Notification unread count stale after mark all read',
  'Kanban drag drops card into wrong column on narrow viewports',
  'Saved filter lost when navigating away from table view',
  'Markdown description strips valid code fence language tags',
  'Project member list missing newly invited developer',
  'Median time to close rounds incorrectly on sub-hour tickets',
  'Login rate limit blocks legitimate retries after lockout window',
  'Ticket search pagination skips items with identical timestamps',
  'Assignee avatar colour shifts when user id casing changes',
  'Comment mention does not notify users with diacritics in name',
  'Dashboard weekly bucket uses local timezone inconsistently',
  'Status transition to done does not set closedAt on bulk update',
  'Table sort on severity does not rank critical above high',
  'Command palette does not focus search input on mobile Safari',
  'Export to CSV not available on archived projects',
  'Sidebar project list does not scroll with many archives',
  'Reopen from done requires comment for testers',
];

async function run(): Promise<void> {
  resetEnvCache();
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);

  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Ticket.deleteMany({}),
    Comment.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  const users = await User.insertMany([
    {
      email: 'ada.admin@sid.example',
      name: 'Ada Admin',
      passwordHash: await User.hashPassword('Password10'),
      role: 'admin',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
    {
      email: 'devon.dev@sid.example',
      name: 'Devon Developer',
      passwordHash: await User.hashPassword('Password10'),
      role: 'developer',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
    {
      email: 'tina.test@sid.example',
      name: 'Tina Tester',
      passwordHash: await User.hashPassword('Password10'),
      role: 'tester',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
    {
      email: 'mara.dev@sid.example',
      name: 'Mara Developer',
      passwordHash: await User.hashPassword('Password10'),
      role: 'developer',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
    {
      email: 'liam.test@sid.example',
      name: 'Liam Tester',
      passwordHash: await User.hashPassword('Password10'),
      role: 'tester',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
    {
      email: 'ivy.admin@sid.example',
      name: 'Ivy Admin',
      passwordHash: await User.hashPassword('Password10'),
      role: 'admin',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  ]);

  const [admin, devon, tina, mara, liam] = users;
  if (!admin || !devon || !tina || !mara || !liam) {
    throw new Error('Seed user batch incomplete');
  }

  const projects = await Project.insertMany([
    {
      name: 'Platform core',
      ticketKeyPrefix: 'SID',
      description: 'Authentication, permissions, and shared services',
      archivedAt: null,
      members: [
        { userId: admin._id, joinedAt: new Date('2025-08-01') },
        { userId: devon._id, joinedAt: new Date('2025-08-03') },
        { userId: tina._id, joinedAt: new Date('2025-08-04') },
        { userId: mara._id, joinedAt: new Date('2025-08-10') },
      ],
      createdBy: admin._id,
      ticketCounter: 0,
    },
    {
      name: 'Client experience',
      ticketKeyPrefix: 'UX',
      description: 'Board, filters, and navigation',
      archivedAt: null,
      members: [
        { userId: admin._id, joinedAt: new Date('2025-09-01') },
        { userId: mara._id, joinedAt: new Date('2025-09-02') },
        { userId: liam._id, joinedAt: new Date('2025-09-03') },
      ],
      createdBy: admin._id,
      ticketCounter: 0,
    },
  ]);

  const statuses = ['backlog', 'in_progress', 'in_review', 'done'] as const;
  const types = ['bug', 'task', 'feature'] as const;
  const issueTypes: IssueType[] = ['bug', 'task', 'story', 'epic'];
  const severities = ['low', 'medium', 'high', 'critical'] as const;

  let ticketCount = 0;
  for (const project of projects) {
    let backlogRank = initialRank();
    for (let i = 0; i < 40; i += 1) {
      const counter = i + 1;
      project.ticketCounter = counter;
      const title = ticketTitles[i % ticketTitles.length] ?? `Backlog item ${counter}`;
      const status = statuses[i % statuses.length] ?? 'backlog';
      const assignee = [devon, mara, tina, liam][i % 4];
      const reporter = i % 3 === 0 ? tina : devon;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - (i % 45));

      const severity = severities[i % severities.length] ?? 'medium';
      const issueType = issueTypes[i % issueTypes.length] ?? 'task';
      const ticket = await Ticket.create({
        projectId: project._id,
        number: counter,
        displayKey: `${project.ticketKeyPrefix}-${counter}`,
        title,
        description: `Steps to reproduce for **${title}**.\n\n1. Open the project board\n2. Apply the saved filter\n3. Observe the mismatch`,
        type: types[i % types.length] ?? 'task',
        issueType,
        severity,
        priority: severityToPriority(severity),
        status,
        assigneeId: assignee?._id ?? null,
        reporterId: reporter._id,
        labels: i % 2 === 0 ? ['regression'] : ['infra'],
        components: i % 3 === 0 ? ['api'] : [],
        rank: backlogRank,
        revision: 0,
        customFieldValues: {},
        timeSpentMinutes: 0,
        dueDate: i % 5 === 0 ? new Date(Date.now() + i * 86_400_000) : null,
        closedAt: status === 'done' ? new Date(createdAt.getTime() + 2 * 86_400_000) : null,
        resolvedAt: status === 'done' ? new Date(createdAt.getTime() + 2 * 86_400_000) : null,
        createdAt,
        updatedAt: createdAt,
      });
      backlogRank = rankAfter(backlogRank);

      if (i % 4 === 0) {
        await Comment.create({
          ticketId: ticket._id,
          authorId: reporter._id,
          body: `Rechecked on build ${1000 + i}. @${assignee?.name ?? 'Devon Developer'} please confirm.`,
          createdAt,
        });
      }

      ticketCount += 1;
    }
    await project.save();
  }

  logger.info({ users: users.length, projects: projects.length, tickets: ticketCount }, 'Seed completed');
  await mongoose.connection.close();
}

void run().catch((err: unknown) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
