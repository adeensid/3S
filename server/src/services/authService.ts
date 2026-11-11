import { AppError } from '../lib/errors.js';
import { User, type UserDocument } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { loadEnv } from '../config/env.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterInput,
} from '../validators/authSchemas.js';
import {
  createRefreshToken,
  hashRefreshToken,
  refreshExpiresAt,
  signAccessToken,
  verifyAccessToken,
} from './tokenService.js';

function toPublicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

async function registerRaw(input: RegisterInput, options?: { allowRole?: boolean }) {
  const data = registerSchema.parse(input);
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email is already registered', 409, 'EMAIL_TAKEN');
  }

  const role = options?.allowRole && data.role ? data.role : 'developer';
  const passwordHash = await User.hashPassword(data.password);
  const user = await User.create({
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash,
    role,
    tokenVersion: 0,
    failedLoginAttempts: 0,
    lockUntil: null,
  });

  return user;
}

export async function registerUser(input: RegisterInput) {
  const user = await registerRaw(input, { allowRole: false });
  const tokens = await issueSession(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function loginUser(input: LoginInput) {
  const data = loginSchema.parse(input);
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const env = loadEnv();

  if (user.isLocked()) {
    throw new AppError('Account is temporarily locked. Try again later.', 423, 'ACCOUNT_LOCKED');
  }

  const valid = await user.comparePassword(data.password);
  if (!valid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.ACCOUNT_LOCKOUT_THRESHOLD) {
      user.lockUntil = new Date(Date.now() + env.ACCOUNT_LOCKOUT_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const tokens = await issueSession(user);
  return { user: toPublicUser(user), ...tokens };
}

async function issueSession(user: UserDocument) {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  const refreshToken = createRefreshToken();
  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshExpiresAt(),
  });
  return { accessToken, refreshToken };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new AppError('Refresh token missing', 401, 'REFRESH_MISSING');
  }

  const hash = hashRefreshToken(refreshToken);
  const session = await RefreshSession.findOne({ tokenHash: hash });
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    throw new AppError('Refresh token invalid or expired', 401, 'REFRESH_INVALID');
  }

  const user = await User.findById(session.userId);
  if (!user) {
    throw new AppError('User not found', 401, 'USER_NOT_FOUND');
  }

  await RefreshSession.deleteOne({ _id: session._id });

  const tokens = await issueSession(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function logoutUser(refreshToken: string | undefined) {
  if (refreshToken) {
    await RefreshSession.deleteOne({ tokenHash: hashRefreshToken(refreshToken) });
  }
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const data = changePasswordSchema.parse(input);
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const matches = await user.comparePassword(data.currentPassword);
  if (!matches) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  user.passwordHash = await User.hashPassword(data.newPassword);
  user.tokenVersion += 1;
  await user.save();
  await RefreshSession.deleteMany({ userId: user._id });

  const tokens = await issueSession(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function getUserFromAccessToken(authorization: string | undefined) {
  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const token = authorization.slice('Bearer '.length);
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError('Session expired', 401, 'SESSION_EXPIRED');
  }

  return user;
}
