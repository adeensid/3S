import type { Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import {
  addComment,
  createTicket,
  deleteComment,
  deleteTicket,
  editComment,
  getTicket,
  listComments,
  listTickets,
  updateTicket,
} from '../services/ticketService.js';
import { routeParam } from '../lib/routeParams.js';

export async function listTicketsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const result = await listTickets(user, routeParam(req.params.projectId), req.query);
  res.json(result);
}

export async function createTicketHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const ticket = await createTicket(user, routeParam(req.params.projectId), req.body);
  res.status(201).json({ ticket });
}

export async function getTicketHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const ticket = await getTicket(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
  );
  res.json({ ticket });
}

export async function updateTicketHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const ticket = await updateTicket(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    req.body,
  );
  res.json({ ticket });
}

export async function deleteTicketHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  await deleteTicket(user, routeParam(req.params.projectId), routeParam(req.params.ticketId));
  res.status(204).send();
}

export async function listCommentsHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const comments = await listComments(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
  );
  res.json({ comments });
}

export async function addCommentHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const comment = await addComment(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    req.body,
  );
  res.status(201).json({ comment });
}

export async function editCommentHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const comment = await editComment(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    routeParam(req.params.commentId),
    req.body,
  );
  res.json({ comment });
}

export async function deleteCommentHandler(req: Request, res: Response): Promise<void> {
  const user = req.currentUser;
  if (!user) {
    throw new AppError('Authorization required', 401, 'UNAUTHORIZED');
  }
  const comment = await deleteComment(
    user,
    routeParam(req.params.projectId),
    routeParam(req.params.ticketId),
    routeParam(req.params.commentId),
  );
  res.json({ comment });
}
