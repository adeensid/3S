import { Router } from 'express';
import {
  listNotificationsHandler,
  markAllReadHandler,
  unreadCountHandler,
} from '../controllers/notificationController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate, requireAuth } from '../middleware/authenticate.js';

export function createNotificationRouter(): Router {
  const router = Router();
  router.get('/', authenticate, requireAuth, asyncHandler(listNotificationsHandler));
  router.get('/unread-count', authenticate, requireAuth, asyncHandler(unreadCountHandler));
  router.post('/mark-all-read', authenticate, requireAuth, asyncHandler(markAllReadHandler));
  return router;
}
