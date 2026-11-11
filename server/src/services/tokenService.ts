import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';
import type { Role } from '../types/roles.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  tokenVersion: number;
}

const REFRESH_COOKIE = 'sid_refresh';

export function getRefreshCookieName(): string {
  return REFRESH_COOKIE;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const env = loadEnv();
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const env = loadEnv();
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid access token payload');
  }
  const record = decoded as Record<string, unknown>;
  if (
    typeof record.sub !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.role !== 'string' ||
    typeof record.tokenVersion !== 'number'
  ) {
    throw new Error('Invalid access token claims');
  }
  return {
    sub: record.sub,
    email: record.email,
    role: record.role as Role,
    tokenVersion: record.tokenVersion,
  };
}

export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshExpiresAt(): Date {
  const env = loadEnv();
  const match = /^(\d+)([dhms])$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  const now = Date.now();
  if (!match) {
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 'd';
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const mult = multipliers[unit] ?? multipliers.d;
  if (!mult) {
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now + amount * mult);
}
