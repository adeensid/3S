import { Router } from 'express';
import { AppError } from '../lib/errors.js';
import { isDatabaseReady } from '../lib/database.js';
import { loadEnv } from '../config/env.js';

export function createHealthRouter(): Router {
  const router = Router();
  const env = loadEnv();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'sid-software-solutions-server',
      environment: env.NODE_ENV,
    });
  });

  router.get('/ready', (_req, res) => {
    if (!isDatabaseReady()) {
      throw new AppError('Database is not connected', 503, 'NOT_READY');
    }
    res.json({ status: 'ready' });
  });

  return router;
}
