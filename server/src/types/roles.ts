import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'developer', 'tester']);

export type Role = z.infer<typeof roleSchema>;

export const ROLES: Role[] = ['admin', 'developer', 'tester'];
