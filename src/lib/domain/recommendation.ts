import type { Difficulty } from './mastery';

/**
 * The recommendation engine.
 *
 * A deterministic slot composer, not a black box. Every question that ends
 * up in a recommended set can name the reason it is there, which is what
 * lets the UI say "5 questions from Logic Gates — your weakest topic this
 * week" instead of the meaningless "Recommended for you" (§11).
 *
 * The seam for any future model-driven planner is `composeRecommendation`:
 * replace the body, keep the shape.
 */

export type SlotKind = 'weak_topic' | 'due_review' | 'recent_mistake' | 'coverage';

export type CandidateQuestion = {
  questionId: string;
  nodeId: string;
  nodeTitle: string;
  difficulty: Difficulty;
  estimatedSeconds: number;
  /** Days overdue — only meaningful for due_review candidates. */
  overdueDays?: number;
};

export type SlotSpec = {
  kind: SlotKind;
  target: number;
  /** Human-readable, shown to the student. */
  describe: (count: number, context?: string) => string;
};

export const DEFAULT_SLOTS: SlotSpec[] = [
  {
    kind: 'weak_topic',
    target: 5,
    describe: (n, topic) =>
      topic ? `${n} from ${topic} — your weakest topic` : `${n} from your weakest topic`,
  },
  {
    kind: 'due_review',
    target: 5,
    describe: (n) => `${n} due for review today`,
  },
  {
    kind: 'recent_mistake',
    target: 3,
    describe: (n) => `${n} you recently got wrong`,
  },
  {
    kind: 'coverage',
    target: 2,
    describe: (n, topic) =>
      topic ? `${n} from ${topic} — not started yet` : `${n} from a topic you haven't tried`,
  },
];

export type CandidatePools = Record<SlotKind, CandidateQuestion[]>;

export type RecommendationItem = {
  questionId: string;
  slot: SlotKind;
  reason: string;
};

export type Recommendation = {
  items: RecommendationItem[];
  /** One line per slot that actually contributed. */
  breakdown: { kind: SlotKind; count: number; description: string }[];
  totalQuestions: number;
  estimatedMinutes: number;
};

/**
 * Fill slots in priority order, de-duplicating across pools.
 *
 * A slot that cannot fill donates its remaining quota to the slots after it,
 * so a student with no due reviews still gets a full set rather than a short
 * one. Order matters: weak-topic work is the most valuable thing we can put
 * in front of a student, so it draws first.
 */
export function composeRecommendation(
  pools: CandidatePools,
  options: { size?: number; slots?: SlotSpec[] } = {},
): Recommendation {
  const slots = options.slots ?? DEFAULT_SLOTS;
  const size = options.size ?? slots.reduce((sum, s) => sum + s.target, 0);

  const used = new Set<string>();
  const items: RecommendationItem[] = [];
  const breakdown: Recommendation['breakdown'] = [];

  let budget = size;

  for (const [index, slot] of slots.entries()) {
    // Any quota unclaimed by earlier slots is available to this one.
    const remainingSlotTargets = slots
      .slice(index + 1)
      .reduce((sum, s) => sum + s.target, 0);
    const allowance = Math.max(0, Math.min(budget - remainingSlotTargets, budget));
    const take = Math.max(slot.target, allowance);

    const pool = sortPool(slot.kind, pools[slot.kind] ?? []);
    const picked: CandidateQuestion[] = [];

    for (const candidate of pool) {
      if (picked.length >= take || budget <= 0) break;
      if (used.has(candidate.questionId)) continue;
      used.add(candidate.questionId);
      picked.push(candidate);
      budget -= 1;
    }

    if (picked.length === 0) continue;

    const context = dominantTopic(picked);
    const description = slot.describe(picked.length, context);

    for (const c of picked) {
      items.push({ questionId: c.questionId, slot: slot.kind, reason: description });
    }
    breakdown.push({ kind: slot.kind, count: picked.length, description });
  }

  const allPicked = [...Object.values(pools).flat()].filter((c) =>
    items.some((i) => i.questionId === c.questionId),
  );
  const seconds = allPicked.reduce((sum, c) => sum + c.estimatedSeconds, 0);

  return {
    items,
    breakdown,
    totalQuestions: items.length,
    estimatedMinutes: Math.max(1, Math.round(seconds / 60)),
  };
}

function sortPool(kind: SlotKind, pool: CandidateQuestion[]): CandidateQuestion[] {
  if (kind === 'due_review') {
    // Most overdue first — the ones closest to being forgotten.
    return [...pool].sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0));
  }
  return pool;
}

/** The topic that most of a slot's picks came from, if there is a clear one. */
function dominantTopic(picked: CandidateQuestion[]): string | undefined {
  const counts = new Map<string, number>();
  for (const p of picked) counts.set(p.nodeTitle, (counts.get(p.nodeTitle) ?? 0) + 1);

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top) return undefined;
  return top[1] / picked.length >= 0.6 ? top[0] : undefined;
}

/** The seam a future AI planner would implement. */
export type Recommender = {
  next(userId: string, size: number): Promise<Recommendation>;
};
