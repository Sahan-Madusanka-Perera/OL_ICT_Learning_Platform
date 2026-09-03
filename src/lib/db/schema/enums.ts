import { pgEnum } from 'drizzle-orm/pg-core';

/* ---------- identity ---------- */
export const userRole = pgEnum('user_role', [
  'student',
  'teacher',
  'admin',
  'superadmin',
]);

export const medium = pgEnum('medium', ['en', 'si', 'ta']);

/* ---------- taxonomy ---------- */
export const nodeLevel = pgEnum('node_level', [
  'unit', // NIE "Competency"        e.g. 3. Data representation
  'topic', // NIE "Competency Level"  e.g. 3.2 Number systems
  'subtopic', // NIE content bullet      e.g. Hexadecimal
  'concept', // fine-grained idea       e.g. Hex → decimal conversion
]);

/* ---------- questions ---------- */
export const questionType = pgEnum('question_type', [
  'mcq_single', // implemented v1
  'mcq_multi', // implemented v1
  'true_false', // implemented v1
  'short_answer', // reserved — V3
  'fill_blank', // reserved — V3
  'matching', // reserved — V3
  'structured', // reserved — V3 (Paper II)
]);

export const difficulty = pgEnum('difficulty', ['easy', 'medium', 'hard']);

export const cognitiveLevel = pgEnum('cognitive_level', [
  'recall',
  'understanding',
  'application',
  'analysis',
]);

export const sourceType = pgEnum('source_type', [
  'past_paper',
  'model',
  'textbook_adapted',
]);

export const questionStatus = pgEnum('question_status', [
  'draft',
  'in_review',
  'approved',
  'published',
  'rejected',
  'archived',
]);

/**
 * How much we actually trust the answer key.
 *
 * Marking schemes are held for only some of the past papers, so a question
 * from an unkeyed year starts life as `unverified` and cannot be published.
 * A keyed one starts as `official_key` but still as a draft: the key proves
 * what the paper's answer was, not that our transcription is faithful.
 * See docs/ARCHITECTURE.md §0.1.
 */
export const answerConfidence = pgEnum('answer_confidence', [
  'official_key', // matched to a Dept. of Examinations marking scheme
  'expert_verified', // two independent reviewers agreed
  'unverified', // never publishable
]);

export const stimulusKind = pgEnum('stimulus_kind', [
  'text',
  'table',
  'image',
  'code',
]);

export const reviewAction = pgEnum('review_action', [
  'submit',
  'approve',
  'reject',
  'request_changes',
  'publish',
  'unpublish',
]);

/* ---------- practice ---------- */
export const practiceMode = pgEnum('practice_mode', [
  'calibration',
  'quick',
  'topic',
  'weak_areas',
  'recommended',
  'past_paper',
  'mock_exam',
  'mistakes',
  'bookmarks',
  'challenge',
]);

export const sessionStatus = pgEnum('session_status', [
  'active',
  'submitted',
  'abandoned',
  'expired',
]);

/* ---------- commerce ---------- */
export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired',
]);

export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);

/* ---------- safety ---------- */
export const reportReason = pgEnum('report_reason', [
  'wrong_answer',
  'unclear_question',
  'typo',
  'broken_image',
  'wrong_topic',
  'bad_explanation',
  'other',
]);

export const reportStatus = pgEnum('report_status', [
  'open',
  'triaged',
  'resolved',
  'dismissed',
]);
