import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  smallint,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { profiles } from './identity';
import { syllabusNodes } from './taxonomy';
import { questions, examPapers } from './content';
import { practiceMode, sessionStatus } from './enums';

/**
 * One attempt at a set of questions — practice or exam. Every mode in the
 * product funnels through this single table, which is what lets a new mode
 * be added without touching the engine (§7).
 */
export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    mode: practiceMode('mode').notNull(),
    /** Mode-specific parameters — kept opaque so modes stay additive. */
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),

    syllabusNodeId: uuid('syllabus_node_id').references(() => syllabusNodes.id, {
      onDelete: 'set null',
    }),
    paperId: uuid('paper_id').references(() => examPapers.id, { onDelete: 'set null' }),

    status: sessionStatus('status').notNull().default('active'),
    questionCount: smallint('question_count').notNull(),

    /** Null for untimed practice. Server-authoritative when set. */
    timeLimitSeconds: integer('time_limit_seconds'),
    /**
     * Computed server-side at creation. Grading refuses answers submitted
     * after this instant, so the client clock is never trusted (§21).
     */
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    /** Immediate feedback for practice; withheld until submit for exams. */
    revealAnswers: boolean('reveal_answers').notNull().default(true),

    score: integer('score'),
    maxScore: integer('max_score'),
    timeSpentMs: integer('time_spent_ms'),

    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (t) => [
    index('sessions_user_idx').on(t.userId, t.startedAt),
    index('sessions_user_status_idx').on(t.userId, t.status),
    index('sessions_expiry_idx').on(t.status, t.expiresAt),
  ],
);

/**
 * The served question list, frozen at session creation.
 *
 * Storing this explicitly means an in-flight session survives a question
 * being edited, unpublished or archived underneath it — the student finishes
 * the paper they started.
 */
export const sessionQuestions = pgTable(
  'session_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    position: smallint('position').notNull(),
    /** Why this question was chosen — powers "from your weakest topic". */
    reason: text('reason'),
    servedAt: timestamp('served_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('session_questions_pos_uq').on(t.sessionId, t.position),
    uniqueIndex('session_questions_q_uq').on(t.sessionId, t.questionId),
  ],
);

export const answers = pgTable(
  'answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => practiceSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    /** Array to support mcq_multi without a schema change. */
    selectedOptionIds: uuid('selected_option_ids').array(),
    /** Reserved for short_answer / fill_blank (V3). */
    textAnswer: text('text_answer'),

    isCorrect: boolean('is_correct'),
    awardedMarks: smallint('awarded_marks'),
    timeSpentMs: integer('time_spent_ms'),

    markedForReview: boolean('marked_for_review').notNull().default(false),
    /** How often the student switched — a signal of genuine uncertainty. */
    changedCount: smallint('changed_count').notNull().default(0),

    answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('answers_session_question_uq').on(t.sessionId, t.questionId),
    index('answers_user_idx').on(t.userId, t.answeredAt),
    index('answers_question_idx').on(t.questionId),
    index('answers_user_question_idx').on(t.userId, t.questionId),
  ],
);

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;
export type SessionQuestion = typeof sessionQuestions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
