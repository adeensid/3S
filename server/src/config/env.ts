import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

loadDotenv({ path: resolve(process.cwd(), '.env') });
loadDotenv({ path: resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  ACCOUNT_LOCKOUT_THRESHOLD: z.coerce.number().int().positive().default(5),
  ACCOUNT_LOCKOUT_DURATION_MS: z.coerce.number().int().positive().default(900_000),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** @internal Tests only */
export function resetEnvCache(): void {
  cached = undefined;
}

export function loadEnv(): Env {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error('Invalid environment configuration:', JSON.stringify(formatted, null, 2));
    process.exit(1);
  }

  cached = parsed.data;
  return cached;
}
