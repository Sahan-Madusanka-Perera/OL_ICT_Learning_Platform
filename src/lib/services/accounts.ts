import 'server-only';

import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles, userCredentials, authSessions } from '@/lib/db/schema';
import { hashPassword, verifyPassword, checkPasswordStrength } from '@/lib/auth/password';
import { createSession, revokeAllSessions } from '@/lib/auth/session';

/**
 * Account creation and sign-in.
 *
 * Two behaviours here are deliberate and worth not "fixing" later:
 *
 *  - Sign-in returns the same message whether the email is unknown or the
 *    password is wrong. Distinguishing them turns the login form into a
 *    tool for discovering which children have accounts.
 *  - A wrong password on an unknown email still runs a hash comparison, so
 *    response time does not reveal whether the account exists.
 */

const DUMMY_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; field?: 'email' | 'password' | 'displayName' };

export async function registerAccount(input: {
  displayName: string;
  email: string;
  password: string;
  grade: number;
}): Promise<AuthResult> {
  const strength = checkPasswordStrength(input.password, input.email);
  if (!strength.ok) return { ok: false, error: strength.message, field: 'password' };

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, input.email))
    .limit(1);

  if (existing) {
    return {
      ok: false,
      error: 'An account already exists with that email. Try signing in instead.',
      field: 'email',
    };
  }

  const passwordHash = await hashPassword(input.password);

  const userId = await db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(profiles)
      .values({
        id: sql`gen_random_uuid()` as unknown as string,
        displayName: input.displayName,
        email: input.email,
        role: 'student',
        grade: input.grade,
        onboardingAt: new Date(),
      })
      .returning();

    if (!profile) throw new Error('Could not create the account.');

    await tx.insert(userCredentials).values({
      userId: profile.id,
      passwordHash,
      // Email verification is wired but not enforced for v1 — students
      // frequently mistype an address they rarely check, and locking them
      // out of practice on day one costs more than it protects.
      emailVerifiedAt: new Date(),
    });

    return profile.id;
  });

  await createSession(userId);
  return { ok: true, userId };
}

export async function authenticate(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const [row] = await db
    .select({
      id: profiles.id,
      deletedAt: profiles.deletedAt,
      passwordHash: userCredentials.passwordHash,
      failedAttempts: userCredentials.failedAttempts,
      lockedUntil: userCredentials.lockedUntil,
    })
    .from(profiles)
    .innerJoin(userCredentials, eq(userCredentials.userId, profiles.id))
    .where(eq(profiles.email, input.email))
    .limit(1);

  const GENERIC = 'That email and password do not match.';

  if (!row || row.deletedAt) {
    // Burn equivalent time so the response does not reveal the difference.
    await verifyPassword(input.password, DUMMY_HASH);
    return { ok: false, error: GENERIC };
  }

  if (row.lockedUntil && row.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((row.lockedUntil.getTime() - Date.now()) / 60_000);
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    };
  }

  const valid = await verifyPassword(input.password, row.passwordHash);

  if (!valid) {
    const attempts = row.failedAttempts + 1;
    await db
      .update(userCredentials)
      .set({
        failedAttempts: attempts,
        lockedUntil:
          attempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
            : null,
      })
      .where(eq(userCredentials.userId, row.id));

    return { ok: false, error: GENERIC };
  }

  if (row.failedAttempts > 0) {
    await db
      .update(userCredentials)
      .set({ failedAttempts: 0, lockedUntil: null })
      .where(eq(userCredentials.userId, row.id));
  }

  await createSession(row.id);
  return { ok: true, userId: row.id };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResult> {
  const strength = checkPasswordStrength(newPassword);
  if (!strength.ok) return { ok: false, error: strength.message, field: 'password' };

  const [row] = await db
    .select({ passwordHash: userCredentials.passwordHash })
    .from(userCredentials)
    .where(eq(userCredentials.userId, userId))
    .limit(1);

  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return { ok: false, error: 'Your current password is not correct.', field: 'password' };
  }

  await db
    .update(userCredentials)
    .set({ passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date() })
    .where(eq(userCredentials.userId, userId));

  // Signing out everywhere is the point of changing a password.
  await revokeAllSessions(userId);
  await createSession(userId);

  return { ok: true, userId };
}

/**
 * Account deletion (§22).
 *
 * A real delete, cascading through every table that references the profile —
 * not a flag that leaves the data in place. Students are entitled to leave.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await db.delete(profiles).where(eq(profiles.id, userId));
}

export async function updateProfile(
  userId: string,
  input: { displayName?: string; grade?: number; leaderboardOptIn?: boolean },
): Promise<void> {
  await db
    .update(profiles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}
