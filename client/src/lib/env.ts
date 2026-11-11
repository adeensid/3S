import { z } from 'zod';

const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:4000'),
});

export const clientEnv = clientEnvSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
});
