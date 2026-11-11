import type { Role } from './types';

type Permission =
  | 'project:create'
  | 'project:manage_members'
  | 'ticket:delete'
  | 'ticket:create';

const map: Record<Role, Set<Permission>> = {
  admin: new Set(['project:create', 'project:manage_members', 'ticket:delete', 'ticket:create']),
  developer: new Set(['ticket:create']),
  tester: new Set(['ticket:create']),
};

export function can(role: Role, permission: Permission): boolean {
  return map[role].has(permission);
}
