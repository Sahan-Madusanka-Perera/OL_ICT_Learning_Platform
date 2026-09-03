/**
 * Answer grading. Pure — no database, no session, no user.
 *
 * This module is the only place that decides whether an answer is right,
 * and it is only ever called on the server (see lib/services/attempts.ts).
 */

export type GradableOption = {
  id: string;
  isCorrect: boolean;
};

export type GradeResult = {
  isCorrect: boolean;
  awardedMarks: number;
  correctOptionIds: string[];
};

/**
 * Grade a multiple-choice answer.
 *
 * `mcq_multi` is all-or-nothing: partial credit on a four-option multi-select
 * rewards shotgunning, and the real examination does not award it either.
 */
export function gradeMcq(
  options: ReadonlyArray<GradableOption>,
  selectedOptionIds: ReadonlyArray<string>,
  marks = 1,
): GradeResult {
  const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id);
  const validSelected = selectedOptionIds.filter((id) =>
    options.some((o) => o.id === id),
  );

  const selectedSet = new Set(validSelected);
  const isCorrect =
    correctIds.length > 0 &&
    selectedSet.size === correctIds.length &&
    correctIds.every((id) => selectedSet.has(id));

  return {
    isCorrect,
    awardedMarks: isCorrect ? marks : 0,
    correctOptionIds: correctIds,
  };
}

export type SessionScore = {
  score: number;
  maxScore: number;
  percentage: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
};

export function scoreSession(
  results: ReadonlyArray<{
    isCorrect: boolean | null;
    awardedMarks: number | null;
    marks: number;
  }>,
): SessionScore {
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let answered = 0;

  for (const r of results) {
    maxScore += r.marks;
    if (r.isCorrect === null) continue;
    answered += 1;
    score += r.awardedMarks ?? 0;
    if (r.isCorrect) correct += 1;
  }

  return {
    score,
    maxScore,
    percentage: maxScore === 0 ? 0 : Math.round((score / maxScore) * 100),
    answered,
    correct,
    incorrect: answered - correct,
    unanswered: results.length - answered,
  };
}

/**
 * Point-biserial discrimination for one question.
 *
 * Correlates "got this right" with "scored well overall". A NEGATIVE value
 * means strong students get it wrong more often than weak students — which
 * in practice almost always means the keyed answer is wrong or the wording
 * is ambiguous. This is the number that finds broken questions (§17).
 */
export function pointBiserial(
  samples: ReadonlyArray<{ correct: boolean; totalScore: number }>,
): number | null {
  if (samples.length < 10) return null;

  const scores = samples.map((s) => s.totalScore);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sd = Math.sqrt(
    scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / scores.length,
  );
  if (sd === 0) return null;

  const groupCorrect = samples.filter((s) => s.correct);
  const groupWrong = samples.filter((s) => !s.correct);
  if (groupCorrect.length === 0 || groupWrong.length === 0) return null;

  const meanOf = (xs: typeof samples) =>
    xs.reduce((a, s) => a + s.totalScore, 0) / xs.length;

  const p = groupCorrect.length / samples.length;

  return ((meanOf(groupCorrect) - meanOf(groupWrong)) / sd) * Math.sqrt(p * (1 - p));
}

/** Facility index: the proportion who got it right. */
export function facilityIndex(attempts: number, correct: number): number | null {
  if (attempts === 0) return null;
  return correct / attempts;
}

export type QuestionHealth = 'ok' | 'too_easy' | 'too_hard' | 'suspect' | 'insufficient_data';

/**
 * Triage a question from its statistics, so an admin sees a verdict rather
 * than two decimals they have to interpret.
 */
export function assessQuestionHealth(stats: {
  attempts: number;
  pValue: number | null;
  discrimination: number | null;
}): QuestionHealth {
  if (stats.attempts < 30 || stats.pValue === null) return 'insufficient_data';
  if (stats.discrimination !== null && stats.discrimination < 0.05) return 'suspect';
  if (stats.pValue > 0.95) return 'too_easy';
  if (stats.pValue < 0.2) return 'too_hard';
  return 'ok';
}
