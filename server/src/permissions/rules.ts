import type { Role } from '../types/roles.js';

export type PermissionAction =
  | 'project:create'
  | 'project:edit'
  | 'project:archive'
  | 'project:manage_members'
  | 'ticket:create'
  | 'ticket:edit'
  | 'ticket:delete'
  | 'ticket:comment'
  | 'ticket:reopen'
  | 'user:change_role';

const rolePermissions: Record<Role, ReadonlySet<PermissionAction>> = {
  admin: new Set([
    'project:create',
    'project:edit',
    'project:archive',
    'project:manage_members',
    'ticket:create',
    'ticket:edit',
    'ticket:delete',
    'ticket:comment',
    'ticket:reopen',
    'user:change_role',
  ]),
  developer: new Set([
    'ticket:create',
    'ticket:edit',
    'ticket:comment',
    'ticket:reopen',
  ]),
  tester: new Set(['ticket:create', 'ticket:comment', 'ticket:reopen']),
};

export function roleCan(role: Role, action: PermissionAction): boolean {
  return rolePermissions[role].has(action);
}
