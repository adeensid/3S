import type { Express } from 'express';
import request from 'supertest';
import { User } from '../models/User.js';
import { connectTestDatabase, clearDatabase, disconnectTestDatabase } from '../test/mongoSetup.js';
import { resetEnvCache } from '../config/env.js';

describe('auth routes', () => {
  let app: Express.Application;
  let http: ReturnType<typeof request>;

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

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('registers and returns access token', async () => {
    const response = await http.post('/api/auth/register').send({
      email: 'dev@sid.example',
      name: 'Dev User',
      password: 'Password10',
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe('dev@sid.example');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('locks account after repeated failed logins', async () => {
    await User.create({
      email: 'lock@sid.example',
      name: 'Lock User',
      passwordHash: await User.hashPassword('Password10'),
      role: 'developer',
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    process.env.ACCOUNT_LOCKOUT_THRESHOLD = '3';
    resetEnvCache();

    for (let i = 0; i < 3; i += 1) {
      await http.post('/api/auth/login').send({
        email: 'lock@sid.example',
        password: 'wrong',
      });
    }

    const locked = await http.post('/api/auth/login').send({
      email: 'lock@sid.example',
      password: 'wrong',
    });

    expect(locked.status).toBe(423);
  });

  it('invalidates refresh sessions after password change', async () => {
    const register = await http.post('/api/auth/register').send({
      email: 'change@sid.example',
      name: 'Change User',
      password: 'Password10',
    });

    const cookieHeader = register.headers['set-cookie'];
    const cookie = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
    if (!cookie) throw new Error('Expected refresh cookie');
    const access = register.body.accessToken as string;

    const changed = await http
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${access}`)
      .set('Cookie', cookie)
      .send({
        currentPassword: 'Password10',
        newPassword: 'Password11',
      });

    expect(changed.status).toBe(200);

    const oldRefresh = await http.post('/api/auth/refresh').set('Cookie', cookie);
    expect(oldRefresh.status).toBe(401);
  });
});
