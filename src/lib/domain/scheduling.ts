/**
 * Spaced repetition — Leitner boxes.
 *
 * Deliberately simple, and honest about being simple (§13). It sits behind
 * the `Scheduler` type so a half-life regression or FSRS can replace it
 * later without a single caller changing. We are not shipping a model we
 * cannot explain to a fifteen-year-old or debug at two in the morning.
 */

export const MAX_BOX = 5;

/** Days until the next review, indexed by box. */
export const BOX_INTERVALS_DAYS = [1, 2, 4, 9, 21, 45] as const;

/** A wrong answer costs two boxes, not all of them — recovery stays possible. */
export const DEMOTION = 2;

/** A question leaves the Mistake Book at this box... */
export const GRADUATION_BOX = 4;
/** ...and only after this many consecutive correct answers. */
export const GRADUATION_STREAK = 2;

export type ReviewState = {
  box: number;
  attempts: number;
  correctAttempts: number;
  consecutiveCorrect: number;
  lastResult: boolean | null;
  nextReviewAt: Date | null;
  graduatedAt: Date | null;
};

export const NEW_REVIEW_STATE: ReviewState = {
  box: 0,
  attempts: 0,
  correctAttempts: 0,
  consecutiveCorrect: 0,
  lastResult: null,
  nextReviewAt: null,
  graduatedAt: null,
};

export function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Advance a question's review state after an answer.
 *
 * A previously graduated question that is answered wrong un-graduates: the
 * Mistake Book must be able to take a question back, or "graduated" would
 * become a claim the platform cannot support.
 */
export function reviewAfterAnswer(
  state: ReviewState,
  correct: boolean,
  now: Date = new Date(),
): ReviewState {
  const box = correct
    ? Math.min(MAX_BOX, state.box + 1)
    : Math.max(0, state.box - DEMOTION);

  const consecutiveCorrect = correct ? state.consecutiveCorrect + 1 : 0;

  const graduated =
    box >= GRADUATION_BOX && consecutiveCorrect >= GRADUATION_STREAK;

  return {
    box,
    attempts: state.attempts + 1,
    correctAttempts: state.correctAttempts + (correct ? 1 : 0),
    consecutiveCorrect,
    lastResult: correct,
    nextReviewAt: addDays(now, BOX_INTERVALS_DAYS[box] ?? 1),
    graduatedAt: graduated ? (state.graduatedAt ?? now) : null,
  };
}

/** Is this question currently in the Mistake Book? */
export function isInMistakeBook(state: ReviewState): boolean {
  if (state.graduatedAt !== null) return false;
  if (state.attempts === 0) return false;
  // Ever answered wrong, and not yet graduated.
  return state.correctAttempts < state.attempts;
}

export function isDue(state: ReviewState, now: Date = new Date()): boolean {
  if (state.nextReviewAt === null) return false;
  if (state.graduatedAt !== null) return false;
  return state.nextReviewAt.getTime() <= now.getTime();
}

/** How overdue, in days. Used to order the review queue. */
export function overdueDays(state: ReviewState, now: Date = new Date()): number {
  if (state.nextReviewAt === null) return 0;
  const ms = now.getTime() - state.nextReviewAt.getTime();
  return Math.max(0, ms / 86_400_000);
}

/** The seam for a future algorithm swap. */
export type Scheduler = {
  next(state: ReviewState, correct: boolean, now?: Date): ReviewState;
  due(state: ReviewState, now?: Date): boolean;
};

export const leitnerScheduler: Scheduler = {
  next: reviewAfterAnswer,
  due: isDue,
};
