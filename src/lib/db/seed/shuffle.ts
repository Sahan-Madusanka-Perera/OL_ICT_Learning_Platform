import type { QuestionSeed } from './questions';

/**
 * Deterministic option shuffling.
 *
 * Authors have habits: writing questions naturally tends to cluster the
 * correct answer in one or two positions, which makes the bank gameable —
 * a student who always picks (2) should not be able to pass. This permutes
 * each question's options before they reach the database.
 *
 * It is seeded from the question stem, so it is stable across runs and
 * across machines: re-seeding does not silently reshuffle a bank that
 * students have already been answering.
 */

/** FNV-1a — small, fast, well-distributed. Not cryptographic; does not need to be. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — a compact, well-behaved seeded PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ShuffledQuestion = QuestionSeed & {
  /** The original authored position, kept for traceability in review. */
  authoredCorrect: 0 | 1 | 2 | 3;
};

export function shuffleQuestion(q: QuestionSeed): ShuffledQuestion {
  const rand = mulberry32(hashString(q.stem));

  const order = [0, 1, 2, 3];
  // Fisher-Yates, driven by the seeded PRNG.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }

  const options = order.map((i) => q.options[i]!) as QuestionSeed['options'];
  const misconceptions = order.map((i) => q.misconceptions[i]!) as QuestionSeed['misconceptions'];
  const correct = order.indexOf(q.correct) as 0 | 1 | 2 | 3;

  return { ...q, options, misconceptions, correct, authoredCorrect: q.correct };
}

export function shuffleAll(questions: readonly QuestionSeed[]): ShuffledQuestion[] {
  return questions.map(shuffleQuestion);
}

/** Distribution of correct-answer positions — used by the seed tests. */
export function answerPositionSpread(questions: readonly QuestionSeed[]): number[] {
  const counts = [0, 0, 0, 0];
  for (const q of questions) counts[q.correct] = (counts[q.correct] ?? 0) + 1;
  return counts;
}
