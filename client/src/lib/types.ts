export type Role = 'admin' | 'developer' | 'tester';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export type TicketStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TicketType = 'bug' | 'task' | 'feature';
export type IssueType = 'epic' | 'story' | 'task' | 'bug' | 'sub_task';
export type TicketSeverity = 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';

export interface Project {
  id: string;
  name: string;
  ticketKeyPrefix: string;
  description: string;
  archivedAt: string | null;
}

export interface Ticket {
  id: string;
  projectId: string;
  displayKey: string;
  number: number;
  title: string;
  description: string;
  type: TicketType;
  issueType?: IssueType;
  severity: TicketSeverity;
  priority?: Priority;
  rank?: string;
  revision?: number;
  epicLinkId?: string | null;
  parentId?: string | null;
  storyPoints?: number | null;
  customFieldValues?: Record<string, unknown>;
  status: TicketStatus;
  assigneeId: string | null;
  reporterId: string;
  labels: string[];
  dueDate: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};
