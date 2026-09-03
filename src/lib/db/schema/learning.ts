import {
  pgTable,
  uuid,
  timestamp,
  integer,
  smallint,
  boolean,
  real,
  date,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { profiles } from './identity';
import { syllabusNodes } from './taxonomy';
import { questions } from './content';

/**
 * Per-student, per-question learning state. Drives the Mistake Book (§12)
 * and spaced repetition (§13).
 */
export const questionStates = pgTable(
  'question_states',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),

    /** Leitner box 0-5. See lib/domain/scheduling.ts. */
    box: smallint('box').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    correctAttempts: integer('correct_attempts').notNull().default(0),
    consecutiveCorrect: smallint('consecutive_correct').notNull().default(0),
    lastResult: boolean('last_result'),

    lastAttemptedAt: timestamp('last_attempted_at', { withTimezone: true }),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    /** Set when the question leaves the Mistake Book for good. */
    graduatedAt: timestamp('graduated_at', { withTimezone: true }),

    isBookmarked: boolean('is_bookmarked').notNull().default(false),
    bookmarkedAt: timestamp('bookmarked_at', { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.questionId] }),
    /* "what is due for review" — the single hottest scheduling query */
    index('question_states_due_idx').on(t.userId, t.nextReviewAt),
    index('question_states_bookmark_idx').on(t.userId, t.isBookmarked),
    index('question_states_mistakes_idx').on(t.userId, t.graduatedAt, t.lastResult),
  ],
);

/**
 * Beta-posterior mastery per syllabus node. See docs/ARCHITECTURE.md §5.
 *
 * alpha/beta hold the *weighted* evidence, so recency decay and difficulty
 * weighting are already baked in. `effectiveN` is what gates whether a
 * percentage is honest enough to show a student at all.
 */
export const nodeMastery = pgTable(
  'node_mastery',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    syllabusNodeId: uuid('syllabus_node_id')
      .notNull()
      .references(() => syllabusNodes.id, { onDelete: 'cascade' }),

    alpha: real('alpha').notNull().default(2),
    beta: real('beta').notNull().default(2),
    effectiveN: real('effective_n').notNull().default(0),

    mastery: real('mastery').notNull().default(0.5),
    masteryLower: real('mastery_lower').notNull().default(0),
    /** Last-10 minus previous-10 accuracy: improving / steady / slipping. */
    trend: real('trend').notNull().default(0),

    attempts: integer('attempts').notNull().default(0),
    correct: integer('correct').notNull().default(0),

    lastPracticedAt: timestamp('last_practiced_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.syllabusNodeId] }),
    /* "my weakest topics", filtered by confidence */
    index('node_mastery_weak_idx').on(t.userId, t.mastery),
    index('node_mastery_stale_idx').on(t.userId, t.lastPracticedAt),
  ],
);

/** Weekly rollup so "mastery over time" is a cheap range scan. */
export const masterySnapshots = pgTable(
  'mastery_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    syllabusNodeId: uuid('syllabus_node_id')
      .notNull()
      .references(() => syllabusNodes.id, { onDelete: 'cascade' }),
    weekStart: date('week_start').notNull(),
    mastery: real('mastery').notNull(),
    effectiveN: real('effective_n').notNull(),
  },
  (t) => [index('mastery_snapshots_idx').on(t.userId, t.weekStart)],
);

/**
 * One row per student per active day. Streaks and the activity heatmap read
 * this instead of aggregating over every answer ever given.
 */
export const dailyActivity = pgTable(
  'daily_activity',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    activityDate: date('activity_date').notNull(),
    answered: integer('answered').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    secondsSpent: integer('seconds_spent').notNull().default(0),
    sessions: integer('sessions').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.activityDate] }),
    index('daily_activity_date_idx').on(t.userId, t.activityDate),
  ],
);

export type QuestionState = typeof questionStates.$inferSelect;
export type NodeMastery = typeof nodeMastery.$inferSelect;
export type DailyActivity = typeof dailyActivity.$inferSelect;
