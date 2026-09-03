import { describe, it, expect } from 'vitest';
import {
  updateMastery,
  masteryFromAttempts,
  viewMastery,
  effectiveSampleSize,
  computeTrend,
  rankWeakNodes,
  targetDifficulty,
  attemptWeight,
  EMPTY_MASTERY,
  RECENCY_HALF_LIFE_DAYS,
  type Difficulty,
} from './mastery';

const medium = (correct: boolean, daysSinceAttempt = 0) => ({
  correct,
  difficulty: 'medium' as Difficulty,
  daysSinceAttempt,
});

describe('mastery — the small-sample guarantee', () => {
  it('does NOT report 100% after two correct answers', () => {
    const state = masteryFromAttempts([medium(true), medium(true)]);
    const view = viewMastery(state);

    expect(view.mastery).toBeCloseTo(2 / 3, 5);
    expect(view.percentage).toBeNull(); // too little data to show anything
    expect(view.confidence).toBe('none');
    expect(view.label).toBe('Not enough practice yet');
  });

  it('withholds a percentage entirely below the display threshold', () => {
    for (let n = 0; n < 4; n++) {
      const state = masteryFromAttempts(Array.from({ length: n }, () => medium(true)));
      expect(viewMastery(state).percentage).toBeNull();
    }
  });

  it('shows a low-confidence percentage in the 4–11 band', () => {
    const state = masteryFromAttempts([
      ...Array.from({ length: 6 }, () => medium(true)),
      ...Array.from({ length: 2 }, () => medium(false)),
    ]);
    const view = viewMastery(state);

    expect(effectiveSampleSize(state)).toBeCloseTo(8, 5);
    expect(view.confidence).toBe('low');
    expect(view.percentage).toBe(67);
  });

  it('reaches full confidence with a real sample', () => {
    const state = masteryFromAttempts([
      ...Array.from({ length: 34 }, () => medium(true)),
      ...Array.from({ length: 6 }, () => medium(false)),
    ]);
    const view = viewMastery(state);

    expect(view.confidence).toBe('high');
    expect(view.percentage).toBe(82);
    expect(view.band).toBe('secure');
  });

  it('keeps the lower bound below the mean, and tightens it as evidence grows', () => {
    const few = masteryFromAttempts(Array.from({ length: 4 }, () => medium(true)));
    const many = masteryFromAttempts(Array.from({ length: 40 }, () => medium(true)));

    const vFew = viewMastery(few);
    const vMany = viewMastery(many);

    expect(vFew.masteryLower).toBeLessThan(vFew.mastery);
    expect(vMany.masteryLower).toBeLessThan(vMany.mastery);
    // More evidence ⇒ the floor rises toward the mean.
    expect(vMany.masteryLower).toBeGreaterThan(vFew.masteryLower);
    expect(vMany.mastery - vMany.masteryLower).toBeLessThan(vFew.mastery - vFew.mastery * 0.5);
  });
});

describe('mastery — weighting', () => {
  it('weights hard questions above easy ones', () => {
    expect(attemptWeight('hard', 0)).toBeGreaterThan(attemptWeight('medium', 0));
    expect(attemptWeight('medium', 0)).toBeGreaterThan(attemptWeight('easy', 0));
  });

  it('halves the weight of evidence after one half-life', () => {
    const fresh = attemptWeight('medium', 0);
    const stale = attemptWeight('medium', RECENCY_HALF_LIFE_DAYS);
    expect(stale).toBeCloseTo(fresh / 2, 6);
  });

  it('lets recent failure outweigh distant success', () => {
    const state = masteryFromAttempts([
      medium(false, 0),
      medium(false, 1),
      ...Array.from({ length: 6 }, (_, i) => medium(true, 180 + i)),
    ]);
    // Six old correct answers should not mask two fresh failures.
    expect(viewMastery(state).mastery).toBeLessThan(0.5);
  });
});

describe('mastery — incremental update matches the batch computation', () => {
  it('produces the same posterior either way', () => {
    // Attempts on days 0, 10, 25, 40 (measured back from "now").
    const daysAgo = [40, 25, 10, 0];
    const results = [true, false, true, true];

    const batch = masteryFromAttempts(
      daysAgo.map((d, i) => ({
        correct: results[i]!,
        difficulty: 'medium' as Difficulty,
        daysSinceAttempt: d,
      })),
    );

    let incremental = EMPTY_MASTERY;
    let previousDaysAgo: number | null = null;
    for (const [i, d] of daysAgo.entries()) {
      incremental = updateMastery(incremental, {
        correct: results[i]!,
        difficulty: 'medium',
        daysSinceLastUpdate: previousDaysAgo === null ? 0 : previousDaysAgo - d,
      });
      previousDaysAgo = d;
    }
    // Bring the incremental state forward to "now".
    incremental = {
      alpha: 2 + (incremental.alpha - 2) * Math.pow(0.5, 0 / RECENCY_HALF_LIFE_DAYS),
      beta: 2 + (incremental.beta - 2) * Math.pow(0.5, 0 / RECENCY_HALF_LIFE_DAYS),
    };

    expect(incremental.alpha).toBeCloseTo(batch.alpha, 6);
    expect(incremental.beta).toBeCloseTo(batch.beta, 6);
  });
});

describe('trend', () => {
  it('refuses to report a trend without two full windows', () => {
    expect(computeTrend(Array.from({ length: 19 }, () => true)).trend).toBe('unknown');
  });

  it('detects improvement', () => {
    const recent = Array.from({ length: 10 }, () => true);
    const previous = Array.from({ length: 10 }, () => false);
    expect(computeTrend([...recent, ...previous]).trend).toBe('improving');
  });

  it('detects slipping', () => {
    const recent = Array.from({ length: 10 }, () => false);
    const previous = Array.from({ length: 10 }, () => true);
    expect(computeTrend([...recent, ...previous]).trend).toBe('slipping');
  });

  it('calls small changes steady', () => {
    // recent 8/10, previous 7/10 — a delta of exactly the threshold.
    const results = [true, true, true, true, true, true, true, true, false, false,
                     true, true, true, true, true, true, true, false, false, false];
    expect(computeTrend(results).trend).toBe('steady');
  });

  it('does not flip on float noise at the exact threshold', () => {
    // 0.8 - 0.7 evaluates to 0.10000000000000009 in IEEE 754.
    const recent = [true, true, true, true, true, true, true, true, false, false];
    const previous = [true, true, true, true, true, true, true, false, false, false];
    const { delta, trend } = computeTrend([...recent, ...previous]);
    expect(delta).toBeGreaterThan(0.1 - 1e-12);
    expect(trend).toBe('steady');
  });
});

describe('weak-node ranking', () => {
  const node = (id: string, mastery: number, effectiveN: number) => ({
    nodeId: id,
    title: id,
    mastery,
    effectiveN,
    lastPracticedAt: null,
  });

  it('excludes topics with too little evidence to judge', () => {
    const ranked = rankWeakNodes([node('barely-touched', 0.1, 2), node('real', 0.4, 20)]);
    expect(ranked.map((n) => n.nodeId)).toEqual(['real']);
  });

  it('puts the weakest well-evidenced topic first', () => {
    const ranked = rankWeakNodes([
      node('databases', 0.54, 15),
      node('logic-gates', 0.43, 18),
      node('networking', 0.78, 20),
    ]);
    expect(ranked[0]!.nodeId).toBe('logic-gates');
    expect(ranked[1]!.nodeId).toBe('databases');
  });

  it('leaves out topics already strong', () => {
    const ranked = rankWeakNodes([node('programming', 0.93, 40)]);
    expect(ranked).toHaveLength(0);
  });
});

describe('target difficulty', () => {
  it('starts a new student on easy questions', () => {
    expect(targetDifficulty(0.5, 'none')).toBe('easy');
  });

  it('steps up as mastery grows', () => {
    expect(targetDifficulty(0.3, 'high')).toBe('easy');
    expect(targetDifficulty(0.6, 'high')).toBe('medium');
    expect(targetDifficulty(0.9, 'high')).toBe('hard');
  });
});
