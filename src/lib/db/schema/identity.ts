import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  smallint,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { userRole, medium } from './enums';

/**
 * Student/staff profile.
 *
 * PII is deliberately minimal (see docs/ARCHITECTURE.md §13). There is no
 * date of birth, no address, and no real-name requirement — `displayName`
 * may be a nickname. The auth record itself lives in Supabase `auth.users`;
 * this row is the application-side mirror keyed by the same id.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // = auth.users.id
    displayName: text('display_name').notNull(),
    email: text('email'), // nullable: phone-OTP accounts have none
    role: userRole('role').notNull().default('student'),

    grade: smallint('grade'), // 10 or 11
    school: text('school'), // optional, free text, never shown publicly
    locale: medium('locale').notNull().default('en'),

    // Denormalised streak counters — recomputed nightly from daily_activity.
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    lastActiveOn: timestamp('last_active_on', { withTimezone: true }),

    onboardingAt: timestamp('onboarding_at', { withTimezone: true }),
    calibratedAt: timestamp('calibrated_at', { withTimezone: true }),

    // Privacy switches. Default to the most private option.
    leaderboardOptIn: boolean('leaderboard_opt_in').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('profiles_email_uq').on(t.email),
    index('profiles_role_idx').on(t.role),
    index('profiles_grade_idx').on(t.grade),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

/* ------------------------------------------------------------------ *
 * Credentials & sessions
 * ------------------------------------------------------------------ *
 *
 * Auth is first-party rather than delegated to a hosted provider. Three
 * reasons, in order of weight:
 *
 *   1. The whole platform runs on nothing but Postgres. No vendor account is
 *      needed to develop, test or self-host it, which matters for a product
 *      that may end up hosted locally in Sri Lanka.
 *   2. The most security-critical path stays reviewable in this repository.
 *   3. Sessions are rows, so "sign out everywhere" and admin session
 *      revocation are ordinary SQL rather than a provider API.
 *
 * Everything below is reached only through lib/auth/*, so an OAuth or
 * phone-OTP provider can be added alongside it without touching callers.
 */

export const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  /** scrypt, salt embedded. See lib/auth/password.ts. */
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),

  /* Brute-force protection, per account. Rate limiting by IP is separate. */
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),

  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Active login sessions.
 *
 * Only a SHA-256 hash of the session token is stored: a database leak does
 * not hand the attacker usable sessions.
 */
export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    index('auth_sessions_token_idx').on(t.tokenHash),
    index('auth_sessions_user_idx').on(t.userId, t.expiresAt),
  ],
);

/** Single-use tokens for email verification and password reset. */
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    purpose: text('purpose').notNull(), // 'verify_email' | 'reset_password'
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('auth_tokens_lookup_idx').on(t.tokenHash, t.purpose),
    index('auth_tokens_user_idx').on(t.userId),
  ],
);

export type AuthSession = typeof authSessions.$inferSelect;
