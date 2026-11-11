import { z } from 'zod';

export const ticketTypeSchema = z.enum(['bug', 'task', 'feature']);
export const ticketSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const ticketStatusSchema = z.enum(['backlog', 'in_progress', 'in_review', 'done']);

export type TicketType = z.infer<typeof ticketTypeSchema>;
export type TicketSeverity = z.infer<typeof ticketSeveritySchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const TICKET_TYPES = ticketTypeSchema.options;
export const TICKET_SEVERITIES = ticketSeveritySchema.options;
export const TICKET_STATUSES: TicketStatus[] = ['backlog', 'in_progress', 'in_review', 'done'];
