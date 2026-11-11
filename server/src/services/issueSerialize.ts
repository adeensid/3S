import type { TicketDoc } from '../models/Ticket.js';
import { normalizeLegacyType, severityToPriority, type IssueType } from '../types/issue.js';

export function resolvedIssueType(ticket: TicketDoc): IssueType {
  if (ticket.issueType) {
    return ticket.issueType;
  }
  return normalizeLegacyType(ticket.type);
}

export function resolvedPriority(ticket: TicketDoc) {
  return ticket.priority ?? severityToPriority(ticket.severity);
}

export function serializeIssue(ticket: TicketDoc) {
  return {
    id: ticket._id.toString(),
    projectId: ticket.projectId.toString(),
    displayKey: ticket.displayKey,
    number: ticket.number,
    title: ticket.title,
    description: ticket.description,
    type: ticket.type,
    issueType: resolvedIssueType(ticket),
    severity: ticket.severity,
    priority: resolvedPriority(ticket),
    status: ticket.status,
    assigneeId: ticket.assigneeId?.toString() ?? null,
    reporterId: ticket.reporterId.toString(),
    labels: ticket.labels,
    components: ticket.components ?? [],
    fixVersion: ticket.fixVersion ?? null,
    affectsVersions: ticket.affectsVersions ?? [],
    storyPoints: ticket.storyPoints ?? null,
    originalEstimateMinutes: ticket.originalEstimateMinutes ?? null,
    timeSpentMinutes: ticket.timeSpentMinutes ?? 0,
    dueDate: ticket.dueDate?.toISOString() ?? null,
    sprintId: ticket.sprintId?.toString() ?? null,
    epicLinkId: ticket.epicLinkId?.toString() ?? null,
    parentId: ticket.parentId?.toString() ?? null,
    rank: ticket.rank,
    revision: ticket.revision,
    customFieldValues: ticket.customFieldValues ?? {},
    closedAt: ticket.closedAt?.toISOString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}
