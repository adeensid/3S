import { Router } from 'express';
import {
  archiveProjectHandler,
  createProjectHandler,
  listProjectsHandler,
  setMembersHandler,
  updateProjectHandler,
} from '../controllers/projectController.js';
import { dashboardHandler } from '../controllers/dashboardController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate, requireAuth } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import {
  addCommentHandler,
  createTicketHandler,
  deleteCommentHandler,
  deleteTicketHandler,
  editCommentHandler,
  getTicketHandler,
  listCommentsHandler,
  listTicketsHandler,
  updateTicketHandler,
} from '../controllers/ticketController.js';
import {
  addWatcherHandler,
  addWorkLogHandler,
  bulkUpdateHandler,
  createCustomFieldHandler,
  createIssueLinkHandler,
  listAttachmentsHandler,
  listCustomFieldsHandler,
  listFieldHistoryHandler,
  listIssueLinksHandler,
  listWatchersHandler,
  listWorkLogsHandler,
  registerAttachmentHandler,
} from '../controllers/issueController.js';

export function createProjectRouter(): Router {
  const router = Router();

  router.get('/', authenticate, requireAuth, asyncHandler(listProjectsHandler));
  router.post(
    '/',
    authenticate,
    requireAuth,
    requirePermission('project:create'),
    asyncHandler(createProjectHandler),
  );

  router.patch(
    '/:projectId',
    authenticate,
    requireAuth,
    requirePermission('project:edit'),
    asyncHandler(updateProjectHandler),
  );
  router.post(
    '/:projectId/archive',
    authenticate,
    requireAuth,
    requirePermission('project:archive'),
    asyncHandler(archiveProjectHandler),
  );
  router.get(
    '/:projectId/dashboard',
    authenticate,
    requireAuth,
    asyncHandler(dashboardHandler),
  );

  router.put(
    '/:projectId/members',
    authenticate,
    requireAuth,
    requirePermission('project:manage_members'),
    asyncHandler(setMembersHandler),
  );

  router.get(
    '/:projectId/tickets',
    authenticate,
    requireAuth,
    asyncHandler(listTicketsHandler),
  );
  router.post(
    '/:projectId/tickets/bulk',
    authenticate,
    requireAuth,
    requirePermission('ticket:edit'),
    asyncHandler(bulkUpdateHandler),
  );

  router.get(
    '/:projectId/custom-fields',
    authenticate,
    requireAuth,
    asyncHandler(listCustomFieldsHandler),
  );
  router.post(
    '/:projectId/custom-fields',
    authenticate,
    requireAuth,
    requirePermission('project:edit'),
    asyncHandler(createCustomFieldHandler),
  );

  router.post(
    '/:projectId/tickets',
    authenticate,
    requireAuth,
    requirePermission('ticket:create'),
    asyncHandler(createTicketHandler),
  );
  router.get(
    '/:projectId/tickets/:ticketId',
    authenticate,
    requireAuth,
    asyncHandler(getTicketHandler),
  );
  router.patch(
    '/:projectId/tickets/:ticketId',
    authenticate,
    requireAuth,
    asyncHandler(updateTicketHandler),
  );
  router.delete(
    '/:projectId/tickets/:ticketId',
    authenticate,
    requireAuth,
    requirePermission('ticket:delete'),
    asyncHandler(deleteTicketHandler),
  );

  router.get(
    '/:projectId/tickets/:ticketId/comments',
    authenticate,
    requireAuth,
    asyncHandler(listCommentsHandler),
  );
  router.post(
    '/:projectId/tickets/:ticketId/comments',
    authenticate,
    requireAuth,
    requirePermission('ticket:comment'),
    asyncHandler(addCommentHandler),
  );
  router.patch(
    '/:projectId/tickets/:ticketId/comments/:commentId',
    authenticate,
    requireAuth,
    requirePermission('ticket:comment'),
    asyncHandler(editCommentHandler),
  );
  router.delete(
    '/:projectId/tickets/:ticketId/comments/:commentId',
    authenticate,
    requireAuth,
    requirePermission('ticket:comment'),
    asyncHandler(deleteCommentHandler),
  );

  router.get(
    '/:projectId/tickets/:ticketId/attachments',
    authenticate,
    requireAuth,
    asyncHandler(listAttachmentsHandler),
  );
  router.post(
    '/:projectId/tickets/:ticketId/attachments',
    authenticate,
    requireAuth,
    requirePermission('ticket:edit'),
    asyncHandler(registerAttachmentHandler),
  );

  router.get(
    '/:projectId/tickets/:ticketId/links',
    authenticate,
    requireAuth,
    asyncHandler(listIssueLinksHandler),
  );
  router.post(
    '/:projectId/tickets/:ticketId/links',
    authenticate,
    requireAuth,
    requirePermission('ticket:edit'),
    asyncHandler(createIssueLinkHandler),
  );

  router.get(
    '/:projectId/tickets/:ticketId/watchers',
    authenticate,
    requireAuth,
    asyncHandler(listWatchersHandler),
  );
  router.post(
    '/:projectId/tickets/:ticketId/watchers',
    authenticate,
    requireAuth,
    asyncHandler(addWatcherHandler),
  );

  router.get(
    '/:projectId/tickets/:ticketId/work-logs',
    authenticate,
    requireAuth,
    asyncHandler(listWorkLogsHandler),
  );
  router.post(
    '/:projectId/tickets/:ticketId/work-logs',
    authenticate,
    requireAuth,
    requirePermission('ticket:edit'),
    asyncHandler(addWorkLogHandler),
  );

  router.get(
    '/:projectId/tickets/:ticketId/history',
    authenticate,
    requireAuth,
    asyncHandler(listFieldHistoryHandler),
  );

  return router;
}
