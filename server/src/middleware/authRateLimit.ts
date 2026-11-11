import rateLimit from 'express-rate-limit';
import { loadEnv } from '../config/env.js';

export function createAuthRateLimit() {
  const env = loadEnv();
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        message: 'Too many authentication attempts. Try again later.',
        code: 'RATE_LIMITED',
      },
    },
  });
}
