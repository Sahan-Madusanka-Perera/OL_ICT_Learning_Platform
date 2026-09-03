import 'server-only';

import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { getCurrentUser, type CurrentUser } from './session';
import { can, isStaff, type Permission } from './rbac';

/**
 * Authorization guards.
 *
 * Every Server Action and every protected page starts with one of these.
 * Hiding a button in the UI is not authorization; this is.
 */

export class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to do that.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/** For pages: redirects to sign-in, preserving where the user was headed. */
export async function requireUserPage(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : '';
    // Query strings are opaque to typed routes; the path itself is a literal.
    redirect(`/sign-in${next}` as Route);
  }
  return user;
}

/** For Server Actions: throws rather than redirecting. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError('You need to be signed in.');
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new AuthorizationError();
  }
  return user;
}

export async function requireStaffPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=%2Fadmin');
  // A student who finds the admin URL gets a 404, not a 403: we do not
  // confirm the existence of an admin area to someone who cannot use it.
  if (!isStaff(user.role)) redirect('/dashboard');
  return user;
}

/**
 * Assert that a record belongs to the requesting user.
 *
 * Used for defence in depth — the queries themselves already filter on
 * user_id, so reaching this throw means a query lost its filter.
 */
export function assertOwnership(ownerId: string, user: CurrentUser): void {
  if (ownerId !== user.id) {
    throw new AuthorizationError('That does not belong to you.');
  }
}
