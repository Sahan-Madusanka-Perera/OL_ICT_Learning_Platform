import { describe, it, expect } from 'vitest';

import { moodFor, labelFor, runFromAnswers, type BitRun } from './companion';

/**
 * BIT is allowed in a design system that bans decorative pixel art only
 * because its face is a readout. These tests are what keep that true: every
 * mood has to be reachable from real answers, and no mood may be reachable
 * from answers that do not support it.
 *
 * The flattery rules are tested as hard as the arithmetic, because they are
 * the ones a future change is most likely to erode.
 */

const answer = (isCorrect: boolean | null) => ({
  selectedOptionIds: ['o1'],
  isCorrect,
});

const ids = (n: number) => Array.from({ length: n }, (_, i) => `q${i}`);

function runOf(verdicts: (boolean | null)[], open = false): BitRun {
  const answers: Record<string, { selectedOptionIds: string[]; isCorrect: boolean | null }> = {};
  verdicts.forEach((v, i) => {
    answers[`q${i}`] = answer(v);
  });
  return runFromAnswers(ids(verdicts.length), answers, open);
}

describe('the run BIT reports', () => {
  it('is empty before the student has answered anything', () => {
    const run = runFromAnswers(ids(3), {}, true);
    expect(run.started).toBe(false);
    expect(run.length).toBe(0);
    expect(moodFor(run)).toBe('waiting');
  });

  it('counts only the trailing same-verdict answers', () => {
    expect(runOf([true, true, false, true, true, true]).length).toBe(3);
    expect(runOf([false, true, false, false]).length).toBe(2);
    expect(runOf([true]).length).toBe(1);
  });

  it('takes its correctness from the most recent answer', () => {
    expect(runOf([true, true, false]).correct).toBe(false);
    expect(runOf([false, false, true]).correct).toBe(true);
  });

  it('ignores questions that were skipped rather than answered', () => {
    const answers = {
      q0: answer(true),
      q1: { selectedOptionIds: [], isCorrect: null }, // skipped
      q2: answer(true),
    };
    const run = runFromAnswers(ids(3), answers, false);
    expect(run.length).toBe(2);
    expect(run.correct).toBe(true);
  });

  it('walks the questions in served order, not object key order', () => {
    const answers = {
      q2: answer(false),
      q0: answer(true),
      q1: answer(true),
    };
    // Served order is q0, q1, q2 — so the run ends on q2's miss.
    const run = runFromAnswers(['q0', 'q1', 'q2'], answers, false);
    expect(run.correct).toBe(false);
    expect(run.length).toBe(1);
  });
});

describe('what BIT will not claim', () => {
  /*
   * An exam withholds correctness until submit, so `isCorrect` arrives as
   * null. BIT must not guess a mood from that — a companion that looks pleased
   * during an exam is inventing feedback the platform deliberately withheld.
   */
  it('stays neutral when the session withholds correctness', () => {
    const run = runOf([null, null, null]);
    expect(run.correct).toBeNull();
    expect(run.length).toBe(0);
    expect(moodFor(run)).toBe('ready');
    expect(labelFor(run)).toBe('Ready');
  });

  it('never reports a streak the answers do not support', () => {
    expect(moodFor(runOf([true]))).toBe('right');
    expect(moodFor(runOf([true, true]))).toBe('right');
    expect(moodFor(runOf([true, true, true]))).toBe('streak');
  });

  it('says what happened rather than judging the student', () => {
    expect(labelFor(runOf([true, true, true, true]))).toBe('4 in a row');
    expect(labelFor(runOf([false]))).toBe('Missed that one');
  });

  it('offers advice instead of a scold once answers go wrong repeatedly', () => {
    const label = labelFor(runOf([false, false, false]));
    expect(moodFor(runOf([false, false, false]))).toBe('wobble');
    expect(label).toContain('slow down');
    expect(label).toContain('3');
  });

  it('carries no praise words at all', () => {
    const forbidden = /\b(great|well done|amazing|perfect|excellent|awesome|brilliant|genius|keep it up)\b/i;
    const cases: BitRun[] = [
      runOf([]),
      runOf([true]),
      runOf([true, true, true, true, true]),
      runOf([false]),
      runOf([false, false, false]),
      runOf([null]),
    ];
    for (const run of cases) {
      expect(labelFor(run), labelFor(run)).not.toMatch(forbidden);
    }
  });
});

describe('the face while a question is open', () => {
  it('waits rather than showing the last verdict', () => {
    const open = runOf([true, true, true], true);
    expect(moodFor(open)).toBe('waiting');
    expect(labelFor(open)).toBe('Take your time');
  });

  it('shows the run again once the answer has landed', () => {
    expect(moodFor(runOf([true, true, true], false))).toBe('streak');
  });
});
