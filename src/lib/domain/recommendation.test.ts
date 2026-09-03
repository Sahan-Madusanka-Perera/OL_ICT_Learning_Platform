import { describe, it, expect } from 'vitest';
import {
  composeRecommendation,
  DEFAULT_SLOTS,
  type CandidatePools,
  type CandidateQuestion,
} from './recommendation';

const q = (
  id: string,
  nodeTitle = 'Logic Gates',
  extra: Partial<CandidateQuestion> = {},
): CandidateQuestion => ({
  questionId: id,
  nodeId: `node-${nodeTitle}`,
  nodeTitle,
  difficulty: 'medium',
  estimatedSeconds: 60,
  ...extra,
});

const pools = (p: Partial<CandidatePools>): CandidatePools => ({
  weak_topic: [],
  due_review: [],
  recent_mistake: [],
  coverage: [],
  ...p,
});

const many = (prefix: string, n: number, topic?: string) =>
  Array.from({ length: n }, (_, i) => q(`${prefix}-${i}`, topic));

describe('recommendation composition', () => {
  it('fills every slot to its target when candidates exist', () => {
    const rec = composeRecommendation(
      pools({
        weak_topic: many('w', 10),
        due_review: many('d', 10, 'Databases'),
        recent_mistake: many('m', 10, 'Networking'),
        coverage: many('c', 10, 'Multimedia'),
      }),
    );

    expect(rec.totalQuestions).toBe(15);
    const counts = Object.fromEntries(rec.breakdown.map((b) => [b.kind, b.count]));
    expect(counts).toEqual({
      weak_topic: 5,
      due_review: 5,
      recent_mistake: 3,
      coverage: 2,
    });
  });

  it('gives every question a reason a student could read', () => {
    const rec = composeRecommendation(pools({ weak_topic: many('w', 5) }));
    expect(rec.items).toHaveLength(5);
    for (const item of rec.items) {
      expect(item.reason).toContain('Logic Gates');
      expect(item.reason).toContain('weakest topic');
    }
  });

  it('never serves the same question twice across slots', () => {
    const shared = q('shared');
    const rec = composeRecommendation(
      pools({
        weak_topic: [shared, ...many('w', 4)],
        due_review: [shared, ...many('d', 4)],
      }),
    );
    const ids = rec.items.map((i) => i.questionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('redistributes an empty slot’s quota rather than returning a short set', () => {
    // No reviews due and no mistakes — a brand-new student.
    const rec = composeRecommendation(
      pools({ weak_topic: many('w', 40), coverage: many('c', 40, 'Databases') }),
      { size: 15 },
    );
    expect(rec.totalQuestions).toBe(15);
    expect(rec.breakdown.map((b) => b.kind)).not.toContain('due_review');
  });

  it('returns a short set honestly when there simply are not enough questions', () => {
    const rec = composeRecommendation(pools({ weak_topic: many('w', 3) }));
    expect(rec.totalQuestions).toBe(3);
  });

  it('handles a completely empty bank without throwing', () => {
    const rec = composeRecommendation(pools({}));
    expect(rec.totalQuestions).toBe(0);
    expect(rec.breakdown).toEqual([]);
    expect(rec.estimatedMinutes).toBe(1);
  });

  it('orders the review queue by how overdue each question is', () => {
    const rec = composeRecommendation(
      pools({
        due_review: [
          q('fresh', 'Databases', { overdueDays: 1 }),
          q('ancient', 'Databases', { overdueDays: 40 }),
          q('middling', 'Databases', { overdueDays: 12 }),
        ],
      }),
      { slots: DEFAULT_SLOTS.filter((s) => s.kind === 'due_review') },
    );
    expect(rec.items.map((i) => i.questionId)).toEqual(['ancient', 'middling', 'fresh']);
  });

  it('estimates time from the questions actually chosen', () => {
    const rec = composeRecommendation(
      pools({
        weak_topic: Array.from({ length: 5 }, (_, i) =>
          q(`w-${i}`, 'Logic Gates', { estimatedSeconds: 90 }),
        ),
      }),
      { slots: DEFAULT_SLOTS.filter((s) => s.kind === 'weak_topic') },
    );
    expect(rec.estimatedMinutes).toBe(8); // 5 × 90s = 450s
  });

  it('names a topic only when the slot really is dominated by one', () => {
    const mixed = composeRecommendation(
      pools({
        weak_topic: [
          q('a', 'Databases'),
          q('b', 'Networking'),
          q('c', 'Multimedia'),
          q('d', 'Programming'),
          q('e', 'Logic Gates'),
        ],
      }),
      { slots: DEFAULT_SLOTS.filter((s) => s.kind === 'weak_topic') },
    );
    expect(mixed.breakdown[0]!.description).toBe('5 from your weakest topic');
  });
});

describe('short-set regression', () => {
  /**
   * Found by running the app: a brand-new student was served three questions
   * when they asked for fifteen, because only the coverage slot could
   * contribute and it drew from thinly-covered topics. The composer itself
   * is correct — it hands back what the pools contain — so this test pins
   * the behaviour the service layer depends on when it tops up.
   */
  it('returns everything available when the pools are short', () => {
    const rec = composeRecommendation(pools({ coverage: many('c', 3, 'ICT basics') }), {
      size: 15,
    });
    expect(rec.totalQuestions).toBe(3);
  });

  it('fills to the requested size once the pool is topped up', () => {
    const rec = composeRecommendation(
      pools({ coverage: [...many('c', 3, 'ICT basics'), ...many('f', 30, 'Filler')] }),
      { size: 15 },
    );
    expect(rec.totalQuestions).toBe(15);
  });

  it('does not duplicate a question that the original pools already supplied', () => {
    const shared = many('c', 3, 'ICT basics');
    const rec = composeRecommendation(
      pools({ weak_topic: shared, coverage: [...shared, ...many('f', 30, 'Filler')] }),
      { size: 15 },
    );
    const ids = rec.items.map((i) => i.questionId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(rec.totalQuestions).toBe(15);
  });
});
