import 'server-only';

import { and, eq, sql, desc, asc, inArray, gte, lte, isNull, isNotNull, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { nodeMastery, syllabusNodes, answers, questions, questionStates } from '@/lib/db/schema';
import {
  updateMastery,
  viewMastery,
  rankWeakNodes,
  rankStrongNodes,
  computeTrend,
  PRIOR_ALPHA,
  PRIOR_BETA,
  type Difficulty,
  type MasteryView,
} from '@/lib/domain/mastery';

/**
 * Mastery persistence.
 *
 * The maths lives in lib/domain/mastery.ts and is pure. This file only
 * loads state, applies the pure update, and writes it back — including up
 * the syllabus tree, so answering a subtopic question also moves its topic
 * and its unit.
 */

export async function applyAnswerToMastery(input: {
  userId: string;
  nodeId: string;
  correct: boolean;
  difficulty: Difficulty;
}): Promise<void> {
  // The answered node plus every ancestor, derived from the materialised path.
  const [node] = await db
    .select({ id: syllabusNodes.id, path: syllabusNodes.path })
    .from(syllabusNodes)
    .where(eq(syllabusNodes.id, input.nodeId))
    .limit(1);

  if (!node) return;

  const ancestorPaths = pathAncestors(node.path);

  const nodes = await db
    .select({ id: syllabusNodes.id })
    .from(syllabusNodes)
    .where(inArray(syllabusNodes.path, ancestorPaths));

  const now = new Date();

  for (const target of nodes) {
    const [existing] = await db
      .select()
      .from(nodeMastery)
      .where(
        and(eq(nodeMastery.userId, input.userId), eq(nodeMastery.syllabusNodeId, target.id)),
      )
      .limit(1);

    const daysSinceLastUpdate = existing?.lastPracticedAt
      ? (now.getTime() - existing.lastPracticedAt.getTime()) / 86_400_000
      : 0;

    const next = updateMastery(
      { alpha: existing?.alpha ?? PRIOR_ALPHA, beta: existing?.beta ?? PRIOR_BETA },
      { correct: input.correct, difficulty: input.difficulty, daysSinceLastUpdate },
    );

    const view = viewMastery(next);

    await db
      .insert(nodeMastery)
      .values({
        userId: input.userId,
        syllabusNodeId: target.id,
        alpha: next.alpha,
        beta: next.beta,
        effectiveN: view.effectiveN,
        mastery: view.mastery,
        masteryLower: view.masteryLower,
        attempts: 1,
        correct: input.correct ? 1 : 0,
        lastPracticedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [nodeMastery.userId, nodeMastery.syllabusNodeId],
        set: {
          alpha: next.alpha,
          beta: next.beta,
          effectiveN: view.effectiveN,
          mastery: view.mastery,
          masteryLower: view.masteryLower,
          attempts: sql`${nodeMastery.attempts} + 1`,
          correct: sql`${nodeMastery.correct} + ${input.correct ? 1 : 0}`,
          lastPracticedAt: now,
          updatedAt: now,
        },
      });
  }
}

/** '03.02.01' → ['03', '03.02', '03.02.01'] */
export function pathAncestors(path: string): string[] {
  const parts = path.split('.');
  return parts.map((_, i) => parts.slice(0, i + 1).join('.'));
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export type NodeMasteryView = {
  nodeId: string;
  code: string;
  title: string;
  level: 'unit' | 'topic' | 'subtopic' | 'concept';
  path: string;
  grade: number | null;
  attempts: number;
  view: MasteryView;
  lastPracticedAt: Date | null;
};

export async function getMasteryForLevel(
  userId: string,
  level: 'unit' | 'topic',
): Promise<NodeMasteryView[]> {
  const rows = await db
    .select({
      nodeId: syllabusNodes.id,
      code: syllabusNodes.code,
      title: syllabusNodes.title,
      level: syllabusNodes.level,
      path: syllabusNodes.path,
      grade: syllabusNodes.grade,
      sortOrder: syllabusNodes.sortOrder,
      alpha: nodeMastery.alpha,
      beta: nodeMastery.beta,
      attempts: nodeMastery.attempts,
      lastPracticedAt: nodeMastery.lastPracticedAt,
    })
    .from(syllabusNodes)
    .leftJoin(
      nodeMastery,
      and(eq(nodeMastery.syllabusNodeId, syllabusNodes.id), eq(nodeMastery.userId, userId)),
    )
    .where(and(eq(syllabusNodes.level, level), eq(syllabusNodes.isActive, true)))
    .orderBy(asc(syllabusNodes.path));

  return rows.map((r) => ({
    nodeId: r.nodeId,
    code: r.code,
    title: r.title,
    level: r.level,
    path: r.path,
    grade: r.grade,
    attempts: r.attempts ?? 0,
    lastPracticedAt: r.lastPracticedAt,
    view: viewMastery({ alpha: r.alpha ?? PRIOR_ALPHA, beta: r.beta ?? PRIOR_BETA }),
  }));
}

export async function getWeakTopics(userId: string, limit = 5) {
  const all = await getMasteryForLevel(userId, 'topic');
  const ranked = rankWeakNodes(
    all.map((n) => ({
      nodeId: n.nodeId,
      title: n.title,
      mastery: n.view.mastery,
      effectiveN: n.view.effectiveN,
      lastPracticedAt: n.lastPracticedAt,
    })),
    limit,
  );
  const byId = new Map(all.map((n) => [n.nodeId, n]));
  return ranked.map((r) => byId.get(r.nodeId)!).filter(Boolean);
}

export async function getStrongTopics(userId: string, limit = 5) {
  const all = await getMasteryForLevel(userId, 'topic');
  const ranked = rankStrongNodes(
    all.map((n) => ({
      nodeId: n.nodeId,
      title: n.title,
      mastery: n.view.mastery,
      effectiveN: n.view.effectiveN,
      lastPracticedAt: n.lastPracticedAt,
    })),
    limit,
  );
  const byId = new Map(all.map((n) => [n.nodeId, n]));
  return ranked.map((r) => byId.get(r.nodeId)!).filter(Boolean);
}

/**
 * Topics the student has genuinely never touched — kept separate from "weak".
 *
 * Two rules, both learned from running this against real data:
 *
 *  - Only topics that actually HAVE published questions. Recommending an
 *    empty topic wastes a slot and produces a short practice set.
 *  - Spread across units, not the first N in syllabus order. Taking them in
 *    path order means a new student's first set comes entirely from Unit 1,
 *    which is a worse introduction to the syllabus and, when Unit 1 is
 *    thinly covered, a much shorter set than they asked for.
 */
export async function getUnstartedTopics(userId: string, limit = 5) {
  const all = await getMasteryForLevel(userId, 'topic');
  const untouched = all.filter((n) => n.attempts === 0);
  if (untouched.length === 0) return [];

  const withQuestions = await filterToPopulated(untouched);
  return spreadAcrossUnits(withQuestions, limit);
}

/** Drop topics that have no published questions beneath them. */
async function filterToPopulated<T extends { path: string }>(nodes: T[]): Promise<T[]> {
  if (nodes.length === 0) return [];

  const rows = await db
    .select({ path: syllabusNodes.path })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(eq(questions.status, 'published'))
    .groupBy(syllabusNodes.path);

  const populated = rows.map((r) => r.path);
  return nodes.filter((n) => populated.some((p) => p.startsWith(n.path)));
}

/** Round-robin one topic per unit, so a set samples the syllabus broadly. */
function spreadAcrossUnits<T extends { path: string }>(nodes: T[], limit: number): T[] {
  const byUnit = new Map<string, T[]>();
  for (const node of nodes) {
    const unit = node.path.split('.')[0] ?? node.path;
    byUnit.set(unit, [...(byUnit.get(unit) ?? []), node]);
  }

  const queues = [...byUnit.values()];
  const out: T[] = [];
  let round = 0;

  while (out.length < limit && queues.some((q) => q.length > round)) {
    for (const queue of queues) {
      if (out.length >= limit) break;
      const item = queue[round];
      if (item) out.push(item);
    }
    round += 1;
  }

  return out;
}

/** Overall mastery, aggregated across every unit with evidence. */
export async function getOverallMastery(userId: string): Promise<MasteryView> {
  const [row] = await db
    .select({
      alpha: sql<number>`coalesce(sum(${nodeMastery.alpha} - ${PRIOR_ALPHA}), 0) + ${PRIOR_ALPHA}`,
      beta: sql<number>`coalesce(sum(${nodeMastery.beta} - ${PRIOR_BETA}), 0) + ${PRIOR_BETA}`,
    })
    .from(nodeMastery)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, nodeMastery.syllabusNodeId))
    .where(and(eq(nodeMastery.userId, userId), eq(syllabusNodes.level, 'unit')));

  return viewMastery({
    alpha: Number(row?.alpha ?? PRIOR_ALPHA),
    beta: Number(row?.beta ?? PRIOR_BETA),
  });
}

/** Recent accuracy trend, from the raw answer history. */
export async function getTrend(userId: string) {
  const rows = await db
    .select({ isCorrect: answers.isCorrect })
    .from(answers)
    .where(and(eq(answers.userId, userId), isNotNull(answers.isCorrect)))
    .orderBy(desc(answers.answeredAt))
    .limit(20);

  return computeTrend(rows.map((r) => r.isCorrect === true));
}

export async function getAnswerCounts(userId: string) {
  const [row] = await db
    .select({
      total: count(),
      correct: sql<number>`count(*) filter (where ${answers.isCorrect} = true)`,
    })
    .from(answers)
    .where(and(eq(answers.userId, userId), isNotNull(answers.isCorrect)));

  const total = Number(row?.total ?? 0);
  const correct = Number(row?.correct ?? 0);
  return {
    total,
    correct,
    accuracy: total === 0 ? null : Math.round((correct / total) * 100),
  };
}
