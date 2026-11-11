import { Router } from 'express';
import { createAuthRateLimit } from '../middleware/authRateLimit.js';
import { authenticate, requireAuth } from '../middleware/authenticate.js';
import {
  changePasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function createAuthRouter(): Router {
  const router = Router();
  const limiter = createAuthRateLimit();

  router.post('/register', limiter, asyncHandler(registerHandler));
  router.post('/login', limiter, asyncHandler(loginHandler));
  router.post('/refresh', asyncHandler(refreshHandler));
  router.post('/logout', asyncHandler(logoutHandler));
  router.get('/me', authenticate, requireAuth, asyncHandler(meHandler));
  router.post('/change-password', authenticate, requireAuth, asyncHandler(changePasswordHandler));

  return router;
}
