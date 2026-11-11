import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';
import { createAuthRouter } from './auth.js';
import { createHealthRouter } from './health.js';
import { createNotificationRouter } from './notifications.js';
import { createProjectRouter } from './projects.js';

export function createApiRouter(): Router {
  const router = Router();
  router.use(createHealthRouter());
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  router.use('/auth', createAuthRouter());
  router.use('/projects', createProjectRouter());
  router.use('/notifications', createNotificationRouter());
  return router;
}
