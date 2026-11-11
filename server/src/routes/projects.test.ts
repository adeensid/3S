import type { Express } from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { connectTestDatabase, clearDatabase, disconnectTestDatabase } from '../test/mongoSetup.js';
import { resetEnvCache } from '../config/env.js';
import { signAccessToken } from '../services/tokenService.js';

describe('project and ticket routes', () => {
  let app: Express.Application;
  let http: ReturnType<typeof request>;
  let adminToken: string;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
    process.env.NODE_ENV = 'test';
    resetEnvCache();
    const { createApp } = await import('../app.js');
    app = createApp();
    http = request(app as Parameters<typeof request>[0]);
    await connectTestDatabase();
  });

  beforeEach(async () => {
    const admin = await User.create({
      email: 'admin@sid.example',
      name: 'Admin',
      passwordHash: await User.hashPassword('Password10'),
      role: 'admin',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    adminToken = signAccessToken({
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      tokenVersion: 0,
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('creates a project and ticket with display key', async () => {
    const projectRes = await http
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Core platform', ticketKeyPrefix: 'SID', description: 'Primary backlog' });

    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.project.id as string;

    const ticketRes = await http
      .post(`/api/projects/${projectId}/tickets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Refresh token not rotated after password change',
        type: 'bug',
        severity: 'high',
      });

    expect(ticketRes.status).toBe(201);
    expect(ticketRes.body.ticket.displayKey).toBe('SID-1');
  });

  it('denies tester ticket deletion', async () => {
    const admin = await User.findOne({ email: 'admin@sid.example' });
    const tester = await User.create({
      email: 'tester@sid.example',
      name: 'Tester',
      passwordHash: await User.hashPassword('Password10'),
      role: 'tester',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    const project = await Project.create({
      name: 'QA',
      ticketKeyPrefix: 'QA',
      description: '',
      archivedAt: null,
      members: [
        { userId: admin!._id, joinedAt: new Date() },
        { userId: tester._id, joinedAt: new Date() },
      ],
      createdBy: admin!._id,
      ticketCounter: 1,
    });
    const ticketId = new Types.ObjectId();
    const { Ticket } = await import('../models/Ticket.js');
    await Ticket.create({
      _id: ticketId,
      projectId: project._id,
      number: 1,
      displayKey: 'QA-1',
      title: 'Sample',
      description: '',
      type: 'task',
      issueType: 'task',
      severity: 'low',
      priority: 'low',
      status: 'backlog',
      assigneeId: null,
      reporterId: admin!._id,
      labels: [],
      components: [],
      rank: '0|m:',
      revision: 0,
      customFieldValues: {},
      timeSpentMinutes: 0,
      dueDate: null,
      closedAt: null,
      resolvedAt: null,
    });

    const testerToken = signAccessToken({
      sub: tester._id.toString(),
      email: tester.email,
      role: tester.role,
      tokenVersion: 0,
    });

    const response = await http
      .delete(`/api/projects/${project._id.toString()}/tickets/${ticketId.toString()}`)
      .set('Authorization', `Bearer ${testerToken}`);

    expect(response.status).toBe(403);
  });
});
