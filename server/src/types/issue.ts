import { z } from 'zod';

export const issueTypeSchema = z.enum(['epic', 'story', 'task', 'bug', 'sub_task']);
export const legacyIssueTypeSchema = z.enum(['bug', 'task', 'feature']);
export const prioritySchema = z.enum(['highest', 'high', 'medium', 'low', 'lowest']);
export const issueLinkTypeSchema = z.enum(['blocks', 'is_blocked_by', 'relates_to', 'duplicates']);
export const customFieldTypeSchema = z.enum([
  'text',
  'number',
  'select',
  'multi_select',
  'date',
  'user',
]);

export type IssueType = z.infer<typeof issueTypeSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type IssueLinkType = z.infer<typeof issueLinkTypeSchema>;
export type CustomFieldType = z.infer<typeof customFieldTypeSchema>;

export const ISSUE_TYPES = issueTypeSchema.options;
export const PRIORITIES = prioritySchema.options;
export const ISSUE_LINK_TYPES = issueLinkTypeSchema.options;

export const PARENT_TYPES: IssueType[] = ['story', 'task', 'bug'];
export const ROOT_TYPES: IssueType[] = ['epic', 'story', 'task', 'bug'];

export function normalizeLegacyType(value: string): IssueType {
  if (value === 'feature') return 'story';
  if (issueTypeSchema.safeParse(value).success) {
    return value as IssueType;
  }
  return 'task';
}

export function severityToPriority(severity: string): Priority {
  const map: Record<string, Priority> = {
    critical: 'highest',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return map[severity] ?? 'medium';
}
