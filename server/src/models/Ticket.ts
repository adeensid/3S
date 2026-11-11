import mongoose, { Schema, type Types } from 'mongoose';
import { PRIORITIES, type IssueType, type Priority } from '../types/issue.js';
import {
  TICKET_SEVERITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  type TicketSeverity,
  type TicketStatus,
  type TicketType,
} from '../types/ticket.js';

export interface TicketDoc extends mongoose.Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  number: number;
  displayKey: string;
  title: string;
  description: string;
  type: TicketType;
  issueType: IssueType;
  severity: TicketSeverity;
  priority: Priority;
  status: TicketStatus;
  assigneeId: Types.ObjectId | null;
  reporterId: Types.ObjectId;
  labels: string[];
  components: string[];
  fixVersion: string | null;
  affectsVersions: string[];
  storyPoints: number | null;
  originalEstimateMinutes: number | null;
  timeSpentMinutes: number;
  dueDate: Date | null;
  sprintId: Types.ObjectId | null;
  epicLinkId: Types.ObjectId | null;
  parentId: Types.ObjectId | null;
  rank: string;
  revision: number;
  customFieldValues: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  resolvedAt: Date | null;
}

const ticketSchema = new Schema<TicketDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    number: { type: Number, required: true },
    displayKey: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, required: true, enum: TICKET_TYPES },
    issueType: { type: String, required: true, enum: ['epic', 'story', 'task', 'bug', 'sub_task'], index: true },
    severity: { type: String, required: true, enum: TICKET_SEVERITIES },
    priority: { type: String, required: true, enum: PRIORITIES, index: true },
    status: { type: String, required: true, enum: TICKET_STATUSES, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    labels: { type: [String], default: [], index: true },
    components: { type: [String], default: [], index: true },
    fixVersion: { type: String, default: null },
    affectsVersions: { type: [String], default: [] },
    storyPoints: { type: Number, default: null, min: 0 },
    originalEstimateMinutes: { type: Number, default: null, min: 0 },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, default: null, index: true },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', default: null, index: true },
    epicLinkId: { type: Schema.Types.ObjectId, ref: 'Ticket', default: null, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Ticket', default: null, index: true },
    rank: { type: String, required: true, index: true },
    revision: { type: Number, required: true, default: 0 },
    customFieldValues: { type: Schema.Types.Mixed, default: {} },
    closedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ticketSchema.index({ projectId: 1, number: 1 }, { unique: true });
ticketSchema.index({ projectId: 1, rank: 1 });
ticketSchema.index({ title: 'text', description: 'text' });

export const Ticket = mongoose.model<TicketDoc>('Ticket', ticketSchema);
