import type { Request, Response } from 'express';
import { loadEnv } from '../config/env.js';
import {
  changePassword,
  getUserFromAccessToken,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '../services/authService.js';
import { getRefreshCookieName } from '../services/tokenService.js';

function setRefreshCookie(res: Response, refreshToken: string) {
  const env = loadEnv();
  res.cookie(getRefreshCookieName(), refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(getRefreshCookieName(), { path: '/api/auth' });
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body);
  setRefreshCookie(res, result.refreshToken);
  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body);
  setRefreshCookie(res, result.refreshToken);
  res.json({
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[getRefreshCookieName()] as string | undefined;
  const result = await refreshSession(token);
  setRefreshCookie(res, result.refreshToken);
  res.json({
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[getRefreshCookieName()] as string | undefined;
  await logoutUser(token);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  const user = await getUserFromAccessToken(req.header('authorization'));
  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

export async function changePasswordHandler(req: Request, res: Response): Promise<void> {
  const user = await getUserFromAccessToken(req.header('authorization'));
  const result = await changePassword(user._id.toString(), req.body);
  setRefreshCookie(res, result.refreshToken);
  res.json({
    user: result.user,
    accessToken: result.accessToken,
  });
}
