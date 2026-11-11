import { loadEnv, resetEnvCache } from './env.js';

describe('loadEnv', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    resetEnvCache();
  });

  it('parses required secrets and cors origins', () => {
    resetEnvCache();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
    process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
    process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:3000';

    const env = loadEnv();

    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/test');
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173', 'http://localhost:3000']);
    expect(env.PORT).toBe(4000);
  });
});
