import 'server-only';

import { randomBytes, createHash } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/lib/db/client';
import { profiles, authSessions } from '@/lib/db/schema';
import type { Role } from './rbac';

export const SESSION_COOKIE = 'olict_session';
export const SESSION_TTL_DAYS = 30;
/** Refresh the expiry at most once a day to avoid a write on every request. */
const SLIDING_REFRESH_HOURS = 24;

export type CurrentUser = {
  id: string;
  displayName: string;
  email: string | null;
  role: Role;
  grade: number | null;
  locale: 'en' | 'si' | 'ta';
  onboardingAt: Date | null;
  calibratedAt: Date | null;
  currentStreak: number;
};

/** The token goes to the browser; only its hash is ever stored. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  const hdrs = await headers();

  await db.insert(authSessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    ip: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: hdrs.get('user-agent')?.slice(0, 500) ?? null,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

/**
 * Resolve the signed-in user.
 *
 * Wrapped in React's `cache` so a page that checks the session in a layout,
 * a page and three components still issues exactly one query per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      sessionId: authSessions.id,
      lastSeenAt: authSessions.lastSeenAt,
      id: profiles.id,
      displayName: profiles.displayName,
      email: profiles.email,
      role: profiles.role,
      grade: profiles.grade,
      locale: profiles.locale,
      onboardingAt: profiles.onboardingAt,
      calibratedAt: profiles.calibratedAt,
      currentStreak: profiles.currentStreak,
      deletedAt: profiles.deletedAt,
    })
    .from(authSessions)
    .innerJoin(profiles, eq(profiles.id, authSessions.userId))
    .where(
      and(
        eq(authSessions.tokenHash, hashToken(token)),
        gt(authSessions.expiresAt, new Date()),
        isNull(authSessions.revokedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || row.deletedAt) return null;

  // Sliding expiry, written at most once a day.
  const staleMs = Date.now() - row.lastSeenAt.getTime();
  if (staleMs > SLIDING_REFRESH_HOURS * 3_600_000) {
    await db
      .update(authSessions)
      .set({
        lastSeenAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000),
      })
      .where(eq(authSessions.id, row.sessionId));
  }

  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    role: row.role,
    grade: row.grade,
    locale: row.locale,
    onboardingAt: row.onboardingAt,
    calibratedAt: row.calibratedAt,
    currentStreak: row.currentStreak,
  };
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.tokenHash, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Used after a password change — every other device is signed out. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
}

export async function purgeExpiredSessions(): Promise<number> {
  const result = await db.execute(
    sql`DELETE FROM auth_sessions WHERE expires_at < now() - interval '7 days'`,
  );
  return result.length ?? 0;
}
