/**
 * Role-based access control.
 *
 * One capability matrix, in one file. Adding a permission is a single line,
 * and every guard in the application resolves through `can()` — so the
 * answer to "who can publish a question?" is readable in one place rather
 * than reconstructed from scattered role comparisons.
 */

export type Role = 'student' | 'teacher' | 'admin' | 'superadmin';

export type Permission =
  /* content */
  | 'question:read_answers'
  | 'question:create'
  | 'question:edit'
  | 'question:delete'
  | 'question:submit_review'
  | 'question:approve'
  | 'question:publish'
  | 'question:import'
  | 'taxonomy:manage'
  | 'paper:manage'
  /* moderation */
  | 'report:triage'
  /* people */
  | 'user:read'
  | 'user:manage_roles'
  /* platform */
  | 'analytics:read'
  | 'audit:read'
  | 'settings:manage';

const TEACHER: Permission[] = [
  'question:read_answers',
  'question:create',
  'question:edit',
  'question:submit_review',
  'report:triage',
  'analytics:read',
];

/**
 * Admins can approve and publish. Note that `question:approve` alone is not
 * sufficient to publish a past-paper question — that needs two distinct
 * approvers, which is enforced in the review service rather than here,
 * because it is a rule about *people*, not about roles.
 */
const ADMIN: Permission[] = [
  ...TEACHER,
  'question:delete',
  'question:approve',
  'question:publish',
  'question:import',
  'taxonomy:manage',
  'paper:manage',
  'user:read',
  'audit:read',
];

const SUPERADMIN: Permission[] = [...ADMIN, 'user:manage_roles', 'settings:manage'];

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  student: new Set<Permission>(),
  teacher: new Set(TEACHER),
  admin: new Set(ADMIN),
  superadmin: new Set(SUPERADMIN),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** Anyone who should see the admin area at all. */
export function isStaff(role: Role): boolean {
  return role !== 'student';
}

export function permissionsFor(role: Role): Permission[] {
  return [...MATRIX[role]];
}
