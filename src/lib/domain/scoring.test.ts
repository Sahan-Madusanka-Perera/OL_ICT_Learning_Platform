import { describe, it, expect } from 'vitest';
import {
  gradeMcq,
  scoreSession,
  pointBiserial,
  facilityIndex,
  assessQuestionHealth,
} from './scoring';

const options = [
  { id: 'a', isCorrect: false },
  { id: 'b', isCorrect: true },
  { id: 'c', isCorrect: false },
  { id: 'd', isCorrect: false },
];

describe('MCQ grading', () => {
  it('marks the right option correct', () => {
    const r = gradeMcq(options, ['b']);
    expect(r.isCorrect).toBe(true);
    expect(r.awardedMarks).toBe(1);
    expect(r.correctOptionIds).toEqual(['b']);
  });

  it('marks a wrong option incorrect', () => {
    expect(gradeMcq(options, ['a']).isCorrect).toBe(false);
  });

  it('treats an empty answer as incorrect rather than throwing', () => {
    const r = gradeMcq(options, []);
    expect(r.isCorrect).toBe(false);
    expect(r.awardedMarks).toBe(0);
  });

  it('ignores option ids that do not belong to this question', () => {
    // A tampered client cannot smuggle in an id and get credit.
    expect(gradeMcq(options, ['b', 'injected-id']).isCorrect).toBe(true);
    expect(gradeMcq(options, ['injected-id']).isCorrect).toBe(false);
  });

  it('does not award credit for selecting everything', () => {
    expect(gradeMcq(options, ['a', 'b', 'c', 'd']).isCorrect).toBe(false);
  });

  it('requires every correct option for a multi-select', () => {
    const multi = [
      { id: 'a', isCorrect: true },
      { id: 'b', isCorrect: true },
      { id: 'c', isCorrect: false },
    ];
    expect(gradeMcq(multi, ['a', 'b']).isCorrect).toBe(true);
    expect(gradeMcq(multi, ['a']).isCorrect).toBe(false); // no partial credit
    expect(gradeMcq(multi, ['a', 'b', 'c']).isCorrect).toBe(false);
  });

  it('is not fooled by duplicate selections', () => {
    expect(gradeMcq(options, ['b', 'b']).isCorrect).toBe(true);
  });

  it('awards the question’s mark value, not always 1', () => {
    expect(gradeMcq(options, ['b'], 4).awardedMarks).toBe(4);
  });
});

describe('session scoring', () => {
  it('counts unanswered questions against the maximum, not as wrong answers', () => {
    const s = scoreSession([
      { isCorrect: true, awardedMarks: 1, marks: 1 },
      { isCorrect: false, awardedMarks: 0, marks: 1 },
      { isCorrect: null, awardedMarks: null, marks: 1 },
    ]);
    expect(s).toMatchObject({
      score: 1,
      maxScore: 3,
      answered: 2,
      correct: 1,
      incorrect: 1,
      unanswered: 1,
      percentage: 33,
    });
  });

  it('handles an empty session without dividing by zero', () => {
    expect(scoreSession([]).percentage).toBe(0);
  });
});

describe('question health', () => {
  it('needs a real sample before judging', () => {
    expect(assessQuestionHealth({ attempts: 5, pValue: 0.5, discrimination: 0.3 }))
      .toBe('insufficient_data');
  });

  it('flags a question that strong students get wrong', () => {
    expect(assessQuestionHealth({ attempts: 200, pValue: 0.5, discrimination: -0.2 }))
      .toBe('suspect');
  });

  it('flags questions nearly everyone gets right or wrong', () => {
    expect(assessQuestionHealth({ attempts: 200, pValue: 0.98, discrimination: 0.3 }))
      .toBe('too_easy');
    expect(assessQuestionHealth({ attempts: 200, pValue: 0.1, discrimination: 0.3 }))
      .toBe('too_hard');
  });

  it('passes a healthy question', () => {
    expect(assessQuestionHealth({ attempts: 200, pValue: 0.62, discrimination: 0.35 }))
      .toBe('ok');
  });

  it('computes facility index, and refuses to on no data', () => {
    expect(facilityIndex(100, 62)).toBeCloseTo(0.62, 5);
    expect(facilityIndex(0, 0)).toBeNull();
  });
});

describe('discrimination', () => {
  const sample = (correct: boolean, totalScore: number) => ({ correct, totalScore });

  it('is positive when strong students do better', () => {
    const samples = [
      ...Array.from({ length: 10 }, () => sample(true, 90)),
      ...Array.from({ length: 10 }, () => sample(false, 40)),
    ];
    expect(pointBiserial(samples)!).toBeGreaterThan(0.5);
  });

  it('is negative when strong students do worse — the broken-question signal', () => {
    const samples = [
      ...Array.from({ length: 10 }, () => sample(true, 30)),
      ...Array.from({ length: 10 }, () => sample(false, 85)),
    ];
    expect(pointBiserial(samples)!).toBeLessThan(0);
  });

  it('declines to report on too little data or no variance', () => {
    expect(pointBiserial([sample(true, 50)])).toBeNull();
    expect(
      pointBiserial(Array.from({ length: 20 }, (_, i) => sample(i % 2 === 0, 50))),
    ).toBeNull(); // zero SD in total scores
  });
});
