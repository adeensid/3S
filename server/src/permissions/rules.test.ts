import { roleCan } from './rules.js';

describe('roleCan', () => {
  it('grants admins project management', () => {
    expect(roleCan('admin', 'project:create')).toBe(true);
    expect(roleCan('admin', 'ticket:delete')).toBe(true);
  });

  it('denies developers member management', () => {
    expect(roleCan('developer', 'project:manage_members')).toBe(false);
    expect(roleCan('developer', 'ticket:edit')).toBe(true);
  });

  it('denies testers delete but allows comment and reopen', () => {
    expect(roleCan('tester', 'ticket:delete')).toBe(false);
    expect(roleCan('tester', 'ticket:comment')).toBe(true);
    expect(roleCan('tester', 'ticket:reopen')).toBe(true);
  });
});
