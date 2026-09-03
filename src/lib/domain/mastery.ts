import { betaQuantile, clamp } from './stats';

/**
 * Topic mastery.
 *
 * The brief is explicit that progress must not mean "questions answered".
 * So mastery here is a Beta posterior over evidence that is weighted by
 * question difficulty and decayed by time — and, crucially, it carries its
 * own confidence, so the product can refuse to show a number it has not
 * earned the right to show.
 *
 * See docs/ARCHITECTURE.md §5.
 */

/* ---------------- tuning constants ---------------- */

/**
 * Beta(2,2) prior: centred on 50% and genuinely uninformative.
 *
 * This is the single most important constant in the file. It is what makes
 * "2 out of 2 correct" read as 67% with no confidence rather than a
 * triumphant 100%. Raising it makes the system more sceptical and slower to
 * celebrate; lowering it flatters students.
 */
export const PRIOR_ALPHA = 2;
export const PRIOR_BETA = 2;

/** Evidence loses half its weight every 30 days. */
export const RECENCY_HALF_LIFE_DAYS = 30;

export const DIFFICULTY_WEIGHT = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.3,
} as const;

/** Below this, we show no percentage at all. */
export const MIN_N_FOR_DISPLAY = 4;
/** Below this, the percentage is labelled an early estimate. */
export const MIN_N_FOR_CONFIDENCE = 12;
/** Percentile used for the conservative floor. */
export const LOWER_BOUND_P = 0.1;

export type Difficulty = keyof typeof DIFFICULTY_WEIGHT;

export type MasteryState = {
  alpha: number;
  beta: number;
};

export type MasteryView = {
  /** Posterior mean, 0–1. */
  mastery: number;
  /** 10th-percentile floor — what we can defend, 0–1. */
  masteryLower: number;
  /** Weighted evidence count, excluding the prior. */
  effectiveN: number;
  confidence: 'none' | 'low' | 'high';
  /** Null when confidence is 'none' — the UI must not invent a number. */
  percentage: number | null;
  band: MasteryBand;
  label: string;
};

export type MasteryBand =
  | 'unknown'
  | 'needs_work'
  | 'developing'
  | 'secure'
  | 'strong';

export const EMPTY_MASTERY: MasteryState = {
  alpha: PRIOR_ALPHA,
  beta: PRIOR_BETA,
};

/* ---------------- core maths ---------------- */

/** Weight of one attempt: fresher and harder questions count for more. */
export function attemptWeight(
  difficulty: Difficulty,
  daysSinceAttempt: number,
): number {
  const recency = Math.pow(0.5, Math.max(0, daysSinceAttempt) / RECENCY_HALF_LIFE_DAYS);
  return DIFFICULTY_WEIGHT[difficulty] * recency;
}

/**
 * Fold one new attempt into an existing posterior.
 *
 * Existing evidence is decayed by the time elapsed since the state was last
 * touched, which makes this an O(1) update that is mathematically identical
 * to re-weighting the entire attempt history from scratch. We never have to
 * replay a student's answers to recompute mastery.
 */
export function updateMastery(
  state: MasteryState,
  attempt: {
    correct: boolean;
    difficulty: Difficulty;
    daysSinceLastUpdate: number;
  },
): MasteryState {
  const decay = Math.pow(
    0.5,
    Math.max(0, attempt.daysSinceLastUpdate) / RECENCY_HALF_LIFE_DAYS,
  );

  // Decay only the accumulated evidence; the prior is not evidence.
  const carriedAlpha = (state.alpha - PRIOR_ALPHA) * decay;
  const carriedBeta = (state.beta - PRIOR_BETA) * decay;

  const w = DIFFICULTY_WEIGHT[attempt.difficulty];

  return {
    alpha: PRIOR_ALPHA + carriedAlpha + (attempt.correct ? w : 0),
    beta: PRIOR_BETA + carriedBeta + (attempt.correct ? 0 : w),
  };
}

/** Batch form — used by the nightly reconciliation job and by tests. */
export function masteryFromAttempts(
  attempts: ReadonlyArray<{
    correct: boolean;
    difficulty: Difficulty;
    daysSinceAttempt: number;
  }>,
): MasteryState {
  let alpha = PRIOR_ALPHA;
  let beta = PRIOR_BETA;

  for (const a of attempts) {
    const w = attemptWeight(a.difficulty, a.daysSinceAttempt);
    if (a.correct) alpha += w;
    else beta += w;
  }
  return { alpha, beta };
}

export function effectiveSampleSize(state: MasteryState): number {
  return Math.max(0, state.alpha + state.beta - PRIOR_ALPHA - PRIOR_BETA);
}

/* ---------------- presentation ---------------- */

export function masteryBand(mastery: number, confidence: MasteryView['confidence']): MasteryBand {
  if (confidence === 'none') return 'unknown';
  if (mastery < 0.5) return 'needs_work';
  if (mastery < 0.7) return 'developing';
  if (mastery < 0.85) return 'secure';
  return 'strong';
}

const BAND_LABEL: Record<MasteryBand, string> = {
  unknown: 'Not enough practice yet',
  needs_work: 'Needs work',
  developing: 'Developing',
  secure: 'Secure',
  strong: 'Strong',
};

/**
 * Turn a posterior into something safe to put in front of a student.
 *
 * The `percentage: null` case is the point of this function. A topic with
 * three attempts genuinely does not have a meaningful percentage, and
 * printing one anyway would be the most common way this product could
 * quietly lie to a student about their own readiness.
 */
export function viewMastery(state: MasteryState): MasteryView {
  const total = state.alpha + state.beta;
  const mean = state.alpha / total;
  const effectiveN = effectiveSampleSize(state);

  const confidence: MasteryView['confidence'] =
    effectiveN < MIN_N_FOR_DISPLAY
      ? 'none'
      : effectiveN < MIN_N_FOR_CONFIDENCE
        ? 'low'
        : 'high';

  const band = masteryBand(mean, confidence);

  return {
    mastery: mean,
    masteryLower: betaQuantile(LOWER_BOUND_P, state.alpha, state.beta),
    effectiveN,
    confidence,
    percentage: confidence === 'none' ? null : Math.round(mean * 100),
    band,
    label: BAND_LABEL[band],
  };
}

/* ---------------- trend ---------------- */

export type Trend = 'improving' | 'steady' | 'slipping' | 'unknown';

/** A swing smaller than this is noise, not a trend. */
export const TREND_THRESHOLD = 0.1;
/** Guards the threshold against float noise on an exact boundary. */
const TREND_EPSILON = 1e-9;

/**
 * Accuracy over the last N attempts minus the N before that.
 *
 * Needs a full two windows before it will say anything — an "improving"
 * badge derived from four answers is noise wearing a badge.
 */
export function computeTrend(
  recentResults: ReadonlyArray<boolean>,
  windowSize = 10,
): { trend: Trend; delta: number } {
  if (recentResults.length < windowSize * 2) return { trend: 'unknown', delta: 0 };

  const recent = recentResults.slice(0, windowSize);
  const previous = recentResults.slice(windowSize, windowSize * 2);

  const rate = (xs: ReadonlyArray<boolean>) =>
    xs.filter(Boolean).length / xs.length;

  const delta = rate(recent) - rate(previous);

  if (delta > TREND_THRESHOLD + TREND_EPSILON) return { trend: 'improving', delta };
  if (delta < -TREND_THRESHOLD - TREND_EPSILON) return { trend: 'slipping', delta };
  return { trend: 'steady', delta };
}

/* ---------------- weak-area ranking ---------------- */

export type RankableNode = {
  nodeId: string;
  title: string;
  mastery: number;
  effectiveN: number;
  lastPracticedAt: Date | null;
};

/**
 * Rank topics for "what am I weak at".
 *
 * Deliberately ranks on the posterior *mean* with a minimum sample rather
 * than on the lower bound. Ranking by lower bound would put barely-touched
 * topics at the top of the list every time, which is noise dressed up as
 * insight. Untouched topics are a separate, honestly-labelled list.
 */
export function rankWeakNodes(
  nodes: ReadonlyArray<RankableNode>,
  limit = 5,
): RankableNode[] {
  return nodes
    .filter((n) => n.effectiveN >= MIN_N_FOR_DISPLAY && n.mastery < 0.85)
    .sort((a, b) => a.mastery - b.mastery || b.effectiveN - a.effectiveN)
    .slice(0, limit);
}

export function rankStrongNodes(
  nodes: ReadonlyArray<RankableNode>,
  limit = 5,
): RankableNode[] {
  return nodes
    .filter((n) => n.effectiveN >= MIN_N_FOR_CONFIDENCE && n.mastery >= 0.7)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, limit);
}

/**
 * Pick the difficulty to serve next: just above where the student is.
 * Aiming at the edge of competence rather than the middle of it.
 */
export function targetDifficulty(mastery: number, confidence: MasteryView['confidence']): Difficulty {
  if (confidence === 'none') return 'easy';
  if (mastery < 0.45) return 'easy';
  if (mastery < 0.75) return 'medium';
  return 'hard';
}

/** Roll child mastery up to a parent node, weighted by evidence. */
export function aggregateMastery(
  children: ReadonlyArray<{ state: MasteryState; weight?: number }>,
): MasteryState {
  if (children.length === 0) return EMPTY_MASTERY;

  let alpha = PRIOR_ALPHA;
  let beta = PRIOR_BETA;

  for (const child of children) {
    const w = child.weight ?? 1;
    alpha += (child.state.alpha - PRIOR_ALPHA) * w;
    beta += (child.state.beta - PRIOR_BETA) * w;
  }
  return { alpha, beta };
}

export function masteryPercent(state: MasteryState): number {
  return clamp(Math.round((state.alpha / (state.alpha + state.beta)) * 100), 0, 100);
}
