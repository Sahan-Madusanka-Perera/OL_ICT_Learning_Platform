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
  primaryKey,
} from 'drizzle-orm/pg-core';
import { profiles } from './identity';
import { syllabusNodes } from './taxonomy';
import {
  questionType,
  difficulty,
  cognitiveLevel,
  sourceType,
  questionStatus,
  answerConfidence,
  stimulusKind,
  reviewAction,
  medium,
} from './enums';

/* ------------------------------------------------------------------ *
 * Assets
 * ------------------------------------------------------------------ */

/**
 * Images referenced by a stem, an option, or a stimulus.
 *
 * This is first-class rather than an afterthought because a large share of
 * real O/L ICT MCQs are picture questions — logic circuits, toolbar icons,
 * spreadsheet segments, flowcharts. In the 2023 paper, questions 13 and 15
 * have options that are *entirely* images.
 */
export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storagePath: text('storage_path').notNull(),
    /** Required. An image-only option is unusable without it. */
    altText: text('alt_text').notNull(),
    mimeType: text('mime_type').notNull(),
    width: integer('width'),
    height: integer('height'),
    byteSize: integer('byte_size'),
    uploadedBy: uuid('uploaded_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('assets_path_uq').on(t.storagePath)],
);

/* ------------------------------------------------------------------ *
 * Papers
 * ------------------------------------------------------------------ */

export const examPapers = pgTable(
  'exam_papers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    year: smallint('year').notNull(),
    /** '2023(2024)' — Sri Lankan papers are sometimes sat the following year. */
    sitting: text('sitting').notNull(),
    paperNo: smallint('paper_no').notNull(), // 1 = MCQ, 2 = structured
    medium: medium('medium').notNull().default('en'),

    title: text('title').notNull(),
    totalQuestions: smallint('total_questions'),
    durationMinutes: smallint('duration_minutes'),
    /** Original PDF this was transcribed from — provenance for §31 trust. */
    sourceFile: text('source_file'),
    sourceUrl: text('source_url'),
    notes: text('notes'),

    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('exam_papers_uq').on(t.year, t.sitting, t.paperNo, t.medium),
    index('exam_papers_year_idx').on(t.year),
  ],
);

/* ------------------------------------------------------------------ *
 * Stimuli — shared context across a question group
 * ------------------------------------------------------------------ */

/**
 * "To answer questions 16 and 17, consider the following spreadsheet
 * segment..." — one stimulus, many questions. Modelling this separately
 * avoids duplicating a diagram across a question group and lets the runner
 * keep the stimulus pinned on screen while the student moves between them.
 */
export const stimuli = pgTable('stimuli', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: stimulusKind('kind').notNull(),
  contentMd: text('content_md'),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ *
 * Questions
 * ------------------------------------------------------------------ */

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Short stable public reference, e.g. 'Q-7F3K2M'. Safe to show/share. */
    publicId: text('public_id').notNull(),

    type: questionType('type').notNull().default('mcq_single'),
    stemMd: text('stem_md').notNull(),
    stimulusId: uuid('stimulus_id').references(() => stimuli.id, {
      onDelete: 'set null',
    }),

    syllabusNodeId: uuid('syllabus_node_id')
      .notNull()
      .references(() => syllabusNodes.id, { onDelete: 'restrict' }),

    difficulty: difficulty('difficulty').notNull().default('medium'),
    cognitiveLevel: cognitiveLevel('cognitive_level').notNull().default('understanding'),

    sourceType: sourceType('source_type').notNull(),
    paperId: uuid('paper_id').references(() => examPapers.id, { onDelete: 'set null' }),
    questionNumber: smallint('question_number'),
    partLabel: text('part_label'), // '(ii)(a)' for Paper II parts

    /* --- the teaching payload (§9) --- */
    explanationMd: text('explanation_md'),
    examTipMd: text('exam_tip_md'),

    marks: smallint('marks').notNull().default(1),
    /** Drives "≈12 minutes" estimates on recommendations. */
    estimatedSeconds: smallint('estimated_seconds').notNull().default(60),

    status: questionStatus('status').notNull().default('draft'),
    /**
     * Gate on publication. `unverified` can never reach `published`;
     * enforced in lib/services/questions and by a CHECK constraint.
     */
    answerConfidence: answerConfidence('answer_confidence').notNull().default('unverified'),

    version: integer('version').notNull().default(1),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
    reviewedBy: uuid('reviewed_by').references(() => profiles.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('questions_public_id_uq').on(t.publicId),
    /* The hot path: "give me published questions for this subtree". */
    index('questions_serve_idx').on(t.status, t.syllabusNodeId, t.difficulty),
    index('questions_node_idx').on(t.syllabusNodeId),
    index('questions_paper_idx').on(t.paperId, t.questionNumber),
    index('questions_status_idx').on(t.status, t.updatedAt),
    index('questions_source_idx').on(t.sourceType),
  ],
);

export const questionOptions = pgTable(
  'question_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),

    label: text('label').notNull(), // '1' | '2' | '3' | '4'
    contentMd: text('content_md'),
    /** Options may be image-only — see assets comment above. */
    assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'set null' }),

    /* NEVER selected by any student-facing query. */
    isCorrect: boolean('is_correct').notNull().default(false),
    /**
     * Why a student would plausibly pick this wrong option.
     * This is what turns an explanation into teaching (§9) and what makes
     * the admin distractor analysis actionable.
     */
    misconceptionMd: text('misconception_md'),

    sortOrder: smallint('sort_order').notNull().default(0),
  },
  (t) => [
    index('question_options_question_idx').on(t.questionId, t.sortOrder),
    uniqueIndex('question_options_label_uq').on(t.questionId, t.label),
  ],
);

/* ------------------------------------------------------------------ *
 * Review & audit trail
 * ------------------------------------------------------------------ */

/** Full snapshot at each version — lets an admin diff and roll back. */
export const questionVersions = pgTable(
  'question_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    changedBy: uuid('changed_by').references(() => profiles.id, { onDelete: 'set null' }),
    changeNote: text('change_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('question_versions_uq').on(t.questionId, t.version)],
);

export const questionReviews = pgTable(
  'question_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id').references(() => profiles.id, { onDelete: 'set null' }),
    action: reviewAction('action').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('question_reviews_question_idx').on(t.questionId, t.createdAt)],
);

/* ------------------------------------------------------------------ *
 * Tags
 * ------------------------------------------------------------------ */

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    label: text('label').notNull(),
  },
  (t) => [uniqueIndex('tags_slug_uq').on(t.slug)],
);

export const questionTags = pgTable(
  'question_tags',
  {
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.tagId] })],
);

export type Asset = typeof assets.$inferSelect;
export type ExamPaper = typeof examPapers.$inferSelect;
export type Stimulus = typeof stimuli.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type NewQuestionOption = typeof questionOptions.$inferInsert;
