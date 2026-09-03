import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, inArray, isNull } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { profiles, questions, questionOptions, questionReviews } from '@/lib/db/schema';
import {
  setAnswerKey,
  transitionQuestion,
  getReviewQueue,
  getReviewQueueYears,
  countQueueWithFigures,
  ReviewError,
} from './review';

/**
 * The editorial guarantees.
 *
 * These are the rules that stop a wrong answer reaching a student, so they
 * are tested against the real database rather than mocked.
 */

let reviewerA = '';
let reviewerB = '';
let draftId = '';
let optionIds: string[] = [];

async function makeStaff(name: string): Promise<string> {
  const [row] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      displayName: name,
      email: `${name.toLowerCase()}-${Date.now()}@test.invalid`,
      role: 'admin',
    })
    .returning();
  return row!.id;
}

beforeAll(async () => {
  reviewerA = await makeStaff('ReviewerA');
  reviewerB = await makeStaff('ReviewerB');

  // A real seeded past-paper draft: no key, no explanation.
  const [draft] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(eq(questions.answerConfidence, 'unverified'), eq(questions.sourceType, 'past_paper')),
    )
    .limit(1);

  expect(draft, 'seed the database first: npm run db:seed').toBeDefined();
  draftId = draft!.id;

  const opts = await db
    .select({ id: questionOptions.id })
    .from(questionOptions)
    .where(eq(questionOptions.questionId, draftId));
  optionIds = opts.map((o) => o.id);
});

afterAll(async () => {
  // Return the question to its unverified draft state.
  await db.delete(questionReviews).where(eq(questionReviews.questionId, draftId));
  await db
    .update(questionOptions)
    .set({ isCorrect: false })
    .where(eq(questionOptions.questionId, draftId));
  await db
    .update(questions)
    .set({ status: 'draft', answerConfidence: 'unverified', explanationMd: null })
    .where(eq(questions.id, draftId));
  await db.delete(profiles).where(inArray(profiles.id, [reviewerA, reviewerB]));
});

describe('nothing reaches a student without a verified answer', () => {
  it('refuses to approve a question with no answer key', async () => {
    await expect(
      transitionQuestion({
        questionId: draftId,
        action: 'approve',
        actorId: reviewerA,
        actorRole: 'admin',
      }),
    ).rejects.toThrow(/answer key/i);
  });

  it('refuses to publish a question with no answer key', async () => {
    await expect(
      transitionQuestion({
        questionId: draftId,
        action: 'publish',
        actorId: reviewerA,
        actorRole: 'admin',
      }),
    ).rejects.toThrow(/explanation|answer key|unverified/i);
  });

  it('rejects an answer key that does not belong to the question', async () => {
    await expect(
      setAnswerKey({
        questionId: draftId,
        correctOptionId: crypto.randomUUID(),
        confidence: 'expert_verified',
        actorId: reviewerA,
      }),
    ).rejects.toThrow(ReviewError);
  });
});

describe('the two-approver rule for past papers', () => {
  it('sets a key and marks it expert-verified', async () => {
    await setAnswerKey({
      questionId: draftId,
      correctOptionId: optionIds[0]!,
      confidence: 'expert_verified',
      actorId: reviewerA,
    });

    const opts = await db
      .select({ id: questionOptions.id, isCorrect: questionOptions.isCorrect })
      .from(questionOptions)
      .where(eq(questionOptions.questionId, draftId));

    expect(opts.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(opts.find((o) => o.isCorrect)!.id).toBe(optionIds[0]);
  });

  it('accepts the first approval but says another is needed', async () => {
    const result = await transitionQuestion({
      questionId: draftId,
      action: 'approve',
      actorId: reviewerA,
      actorRole: 'admin',
    });
    expect(result.status).toBe('approved');
    expect(result.message).toMatch(/1 more independent approval/i);
  });

  it('refuses to publish on one approval', async () => {
    // Give it the explanation the database also insists on, to prove the
    // refusal is about approvals and not something else.
    await db
      .update(questions)
      .set({ explanationMd: 'Reviewed explanation.' })
      .where(eq(questions.id, draftId));

    await expect(
      transitionQuestion({
        questionId: draftId,
        action: 'publish',
        actorId: reviewerA,
        actorRole: 'admin',
      }),
    ).rejects.toThrow(/two independent approvals/i);
  });

  it('does not count the same reviewer approving twice', async () => {
    await transitionQuestion({
      questionId: draftId,
      action: 'approve',
      actorId: reviewerA,
      actorRole: 'admin',
    });

    await expect(
      transitionQuestion({
        questionId: draftId,
        action: 'publish',
        actorId: reviewerA,
        actorRole: 'admin',
      }),
    ).rejects.toThrow(/two independent approvals/i);
  });

  it('publishes once a second, different reviewer approves', async () => {
    await transitionQuestion({
      questionId: draftId,
      action: 'approve',
      actorId: reviewerB,
      actorRole: 'admin',
    });

    const result = await transitionQuestion({
      questionId: draftId,
      action: 'publish',
      actorId: reviewerA,
      actorRole: 'admin',
    });

    expect(result.status).toBe('published');

    const [row] = await db
      .select({ status: questions.status, publishedAt: questions.publishedAt })
      .from(questions)
      .where(eq(questions.id, draftId));

    expect(row!.status).toBe('published');
    expect(row!.publishedAt).not.toBeNull();
  });

  it('records every transition in the audit trail', async () => {
    const reviews = await db
      .select({ action: questionReviews.action })
      .from(questionReviews)
      .where(eq(questionReviews.questionId, draftId));

    expect(reviews.filter((r) => r.action === 'approve').length).toBeGreaterThanOrEqual(3);
    expect(reviews.some((r) => r.action === 'publish')).toBe(true);
  });
});

describe('the review queue', () => {
  it('puts questions with no answer key where a reviewer will see them', async () => {
    const queue = await getReviewQueue(50);
    const blocked = queue.filter((q) => !q.hasKey);
    expect(blocked.length).toBeGreaterThan(0);
    for (const item of blocked) {
      expect(item.answerConfidence).toBe('unverified');
    }
  });

  it('orders stably, so saving a key does not reshuffle the list', async () => {
    const first = await getReviewQueue(50);
    // Touch a question the way saving a key would.
    await db
      .update(questions)
      .set({ updatedAt: new Date() })
      .where(eq(questions.id, first.at(-1)!.id));

    const second = await getReviewQueue(50);
    expect(second.map((q) => q.id)).toEqual(first.map((q) => q.id));
  });
});

/**
 * Reachability.
 *
 * The queue holds ~529 questions and a page of it is 50, ordered by paper and
 * question number so a reviewer keeps their place. Every figure recovered from
 * the papers is on a 2020+ paper, which put the first one at position 314 —
 * seeded, rendered, attached, and invisible. These guard the filters that make
 * them reachable, because the bug was not in the data.
 */
describe('review queue filters', () => {
  it('finds questions carrying a figure, which the unfiltered page cannot reach', async () => {
    const figureCount = await countQueueWithFigures();
    expect(figureCount).toBeGreaterThan(0);

    const unfiltered = await getReviewQueue(50);
    expect(unfiltered.some((q) => q.hasFigure)).toBe(false);

    const withFigures = await getReviewQueue(50, { hasFigure: true });
    expect(withFigures.length).toBeGreaterThan(0);
    for (const item of withFigures) {
      expect(item.hasFigure, item.paperLabel ?? item.id).toBe(true);
    }
  });

  it('excludes them when asked for the other side', async () => {
    const without = await getReviewQueue(50, { hasFigure: false });
    for (const item of without) {
      expect(item.hasFigure).toBe(false);
    }
  });

  it('restricts to one paper year', async () => {
    const years = await getReviewQueueYears();
    expect(years.length).toBeGreaterThan(0);
    // Newest first, so a reviewer meets the papers students actually sat.
    expect(years).toEqual([...years].sort((a, b) => b - a));

    const year = years[0]!;
    const rows = await getReviewQueue(50, { year });
    expect(rows.length).toBeGreaterThan(0);
    for (const item of rows) {
      expect(item.paperLabel, item.id).toContain(String(year));
    }
  });

  it('combines both filters', async () => {
    const figureYears = new Set<number>();
    for (const item of await getReviewQueue(50, { hasFigure: true })) {
      const y = Number(item.paperLabel?.slice(0, 4));
      if (Number.isInteger(y)) figureYears.add(y);
    }
    const year = [...figureYears][0];
    expect(year, 'expected a year with figures in the queue').toBeDefined();
    if (year === undefined) return;

    const rows = await getReviewQueue(50, { year, hasFigure: true });
    expect(rows.length).toBeGreaterThan(0);
    for (const item of rows) {
      expect(item.hasFigure).toBe(true);
      expect(item.paperLabel).toContain(String(year));
    }
  });
});
