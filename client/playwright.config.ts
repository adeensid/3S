import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev -w @sid-software-solutions/server',
      url: 'http://127.0.0.1:4000/api/health',
      reuseExistingServer: true,
      env: {
        NODE_ENV: 'test',
        PORT: '4000',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/sid-e2e',
        JWT_ACCESS_SECRET: 'e2e-access-secret-minimum-32-characters',
        JWT_REFRESH_SECRET: 'e2e-refresh-secret-minimum-32-characters',
        CORS_ORIGINS: 'http://127.0.0.1:5173',
      },
    },
    {
      command: 'npm run dev -w @sid-software-solutions/client',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
    },
  ],
});
