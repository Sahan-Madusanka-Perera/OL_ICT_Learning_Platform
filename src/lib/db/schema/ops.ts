import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core';
import { profiles } from './identity';
import { questions } from './content';
import { reportReason, reportStatus } from './enums';

/* ------------------------------------------------------------------ *
 * Question quality analytics (§17)
 * ------------------------------------------------------------------ */

/**
 * Rolled up nightly. This is the table that finds broken questions.
 *
 * `discrimination` is the point-biserial correlation between getting this
 * question right and overall performance. A NEGATIVE value means strong
 * students get it wrong more often than weak ones — which almost always
 * means the keyed answer is wrong or the wording is ambiguous.
 */
export const questionStats = pgTable(
  'question_stats',
  {
    questionId: uuid('question_id')
      .primaryKey()
      .references(() => questions.id, { onDelete: 'cascade' }),
    attempts: integer('attempts').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    /** Facility index: proportion correct. <0.2 or >0.95 is worth a look. */
    pValue: real('p_value'),
    discrimination: real('discrimination'),
    avgTimeMs: integer('avg_time_ms'),
    /** { optionId: timesChosen } — surfaces the dominant misconception. */
    optionCounts: jsonb('option_counts').$type<Record<string, number>>(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('question_stats_discrimination_idx').on(t.discrimination),
    index('question_stats_pvalue_idx').on(t.pValue),
  ],
);

/* ------------------------------------------------------------------ *
 * Student-reported content problems
 * ------------------------------------------------------------------ */

/** Students are the largest QA team this platform will ever have. */
export const contentReports = pgTable(
  'content_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    reason: reportReason('reason').notNull(),
    detail: text('detail'),
    status: reportStatus('status').notNull().default('open'),
    resolvedBy: uuid('resolved_by').references(() => profiles.id, { onDelete: 'set null' }),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [
    index('content_reports_status_idx').on(t.status, t.createdAt),
    index('content_reports_question_idx').on(t.questionId),
  ],
);

/* ------------------------------------------------------------------ *
 * Audit log (§21)
 * ------------------------------------------------------------------ */

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // 'question.publish'
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_actor_idx').on(t.actorId, t.createdAt),
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    index('audit_logs_action_idx').on(t.action, t.createdAt),
  ],
);

/* ------------------------------------------------------------------ *
 * First-party analytics
 * ------------------------------------------------------------------ */

/**
 * We do not ship minors' behaviour to a third-party SDK (§22). Product
 * analytics is this table and nothing else.
 */
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    props: jsonb('props').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_name_idx').on(t.name, t.createdAt),
    index('events_user_idx').on(t.userId, t.createdAt),
  ],
);

/* ------------------------------------------------------------------ *
 * Free-tier usage counters (§20)
 * ------------------------------------------------------------------ */

export const usageCounters = pgTable(
  'usage_counters',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    usageDate: date('usage_date').notNull(),
    metric: text('metric').notNull(), // 'questions_answered'
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.usageDate, t.metric] })],
);

export type QuestionStats = typeof questionStats.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
