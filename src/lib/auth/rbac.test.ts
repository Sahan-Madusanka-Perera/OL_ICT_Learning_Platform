import { describe, it, expect } from 'vitest';
import { can, isStaff, permissionsFor, type Role, type Permission } from './rbac';

const ROLES: Role[] = ['student', 'teacher', 'admin', 'superadmin'];

describe('RBAC', () => {
  it('gives students no administrative capability whatsoever', () => {
    expect(permissionsFor('student')).toEqual([]);
    for (const p of permissionsFor('superadmin')) {
      expect(can('student', p)).toBe(false);
    }
  });

  it('never lets a student read answer keys through the permission system', () => {
    expect(can('student', 'question:read_answers')).toBe(false);
  });

  it('lets teachers author and submit, but not approve or publish their own work', () => {
    expect(can('teacher', 'question:create')).toBe(true);
    expect(can('teacher', 'question:submit_review')).toBe(true);
    expect(can('teacher', 'question:approve')).toBe(false);
    expect(can('teacher', 'question:publish')).toBe(false);
    expect(can('teacher', 'question:delete')).toBe(false);
  });

  it('reserves role management and settings for superadmins', () => {
    expect(can('admin', 'user:manage_roles')).toBe(false);
    expect(can('superadmin', 'user:manage_roles')).toBe(true);
    expect(can('admin', 'settings:manage')).toBe(false);
    expect(can('superadmin', 'settings:manage')).toBe(true);
  });

  it('is strictly cumulative up the hierarchy', () => {
    const chain: Role[] = ['student', 'teacher', 'admin', 'superadmin'];
    for (let i = 0; i < chain.length - 1; i++) {
      const lower = permissionsFor(chain[i]!);
      const higher = new Set(permissionsFor(chain[i + 1]!));
      for (const p of lower) {
        expect(higher.has(p as Permission)).toBe(true);
      }
    }
  });

  it('treats only students as non-staff', () => {
    expect(isStaff('student')).toBe(false);
    for (const r of ROLES.filter((r) => r !== 'student')) {
      expect(isStaff(r)).toBe(true);
    }
  });
});
