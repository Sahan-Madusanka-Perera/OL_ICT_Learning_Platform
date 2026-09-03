import 'server-only';

import { and, eq, sql, desc, asc, isNull, isNotNull, lte, inArray, ne } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { questions, questionStates, syllabusNodes, nodeMastery } from '@/lib/db/schema';
import {
  composeRecommendation,
  type CandidatePools,
  type CandidateQuestion,
  type Recommendation,
} from '@/lib/domain/recommendation';
import { targetDifficulty, viewMastery, PRIOR_ALPHA, PRIOR_BETA } from '@/lib/domain/mastery';
import { getWeakTopics, getUnstartedTopics } from './mastery';

/**
 * Builds the four candidate pools and hands them to the pure composer in
 * lib/domain/recommendation.ts.
 *
 * All the *policy* is in the domain module; this file only fetches.
 */

const PUBLISHED = and(eq(questions.status, 'published'), isNull(questions.deletedAt));

export async function getRecommendation(
  userId: string,
  size = 15,
): Promise<Recommendation> {
  const [weakTopics, unstarted] = await Promise.all([
    getWeakTopics(userId, 3),
    getUnstartedTopics(userId, 3),
  ]);

  const [weakPool, duePool, mistakePool, coveragePool] = await Promise.all([
    weakTopicCandidates(userId, weakTopics),
    dueReviewCandidates(userId, 12),
    recentMistakeCandidates(userId, 10),
    coverageCandidates(userId, unstarted),
  ]);

  const pools: CandidatePools = {
    weak_topic: weakPool,
    due_review: duePool,
    recent_mistake: mistakePool,
    coverage: coveragePool,
  };

  const recommendation = composeRecommendation(pools, { size });

  // Top up if the slots could not fill.
  //
  // This matters more than it looks. A new student has no weak topics, no
  // reviews due and no mistakes, so only the coverage slot can contribute —
  // and if the topics it draws from happen to be thinly covered, they get a
  // three-question "set" when they asked for fifteen. Any student can hit
  // the same problem once they have cleared their mistakes and reviews.
  if (recommendation.totalQuestions >= size) return recommendation;

  const already = new Set(recommendation.items.map((i) => i.questionId));
  const filler = (await starterCandidates(size * 2)).filter(
    (c) => !already.has(c.questionId),
  );

  if (filler.length === 0) return recommendation;

  return composeRecommendation(
    { ...pools, coverage: [...pools.coverage, ...filler] },
    { size },
  );
}

/* ---------------- pools ---------------- */

async function weakTopicCandidates(
  userId: string,
  weakTopics: Awaited<ReturnType<typeof getWeakTopics>>,
): Promise<CandidateQuestion[]> {
  if (weakTopics.length === 0) return [];

  const out: CandidateQuestion[] = [];

  for (const topic of weakTopics) {
    // Aim just above where the student currently is.
    const difficulty = targetDifficulty(topic.view.mastery, topic.view.confidence);

    const rows = await db
      .select({
        questionId: questions.id,
        difficulty: questions.difficulty,
        estimatedSeconds: questions.estimatedSeconds,
        nodeId: syllabusNodes.id,
        nodeTitle: syllabusNodes.title,
      })
      .from(questions)
      .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
      .leftJoin(
        questionStates,
        and(
          eq(questionStates.questionId, questions.id),
          eq(questionStates.userId, userId),
        ),
      )
      .where(
        and(
          PUBLISHED,
          sql`${syllabusNodes.path} LIKE ${topic.path + '%'}`,
          // Prefer unseen questions; a recently-answered one teaches less.
          isNull(questionStates.questionId),
        ),
      )
      .orderBy(
        // Questions at the target difficulty first, then anything else.
        sql`case when ${questions.difficulty} = ${difficulty} then 0 else 1 end`,
        sql`random()`,
      )
      .limit(8);

    out.push(
      ...rows.map((r) => ({
        questionId: r.questionId,
        nodeId: r.nodeId,
        nodeTitle: topic.title,
        difficulty: r.difficulty,
        estimatedSeconds: r.estimatedSeconds,
      })),
    );
  }

  return out;
}

async function dueReviewCandidates(userId: string, limit: number): Promise<CandidateQuestion[]> {
  const rows = await db
    .select({
      questionId: questions.id,
      difficulty: questions.difficulty,
      estimatedSeconds: questions.estimatedSeconds,
      nodeId: syllabusNodes.id,
      nodeTitle: syllabusNodes.title,
      nextReviewAt: questionStates.nextReviewAt,
    })
    .from(questionStates)
    .innerJoin(questions, eq(questions.id, questionStates.questionId))
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(
      and(
        eq(questionStates.userId, userId),
        isNull(questionStates.graduatedAt),
        isNotNull(questionStates.nextReviewAt),
        lte(questionStates.nextReviewAt, new Date()),
        PUBLISHED,
      ),
    )
    .orderBy(asc(questionStates.nextReviewAt))
    .limit(limit);

  const now = Date.now();
  return rows.map((r) => ({
    questionId: r.questionId,
    nodeId: r.nodeId,
    nodeTitle: r.nodeTitle,
    difficulty: r.difficulty,
    estimatedSeconds: r.estimatedSeconds,
    overdueDays: r.nextReviewAt
      ? Math.max(0, (now - r.nextReviewAt.getTime()) / 86_400_000)
      : 0,
  }));
}

async function recentMistakeCandidates(
  userId: string,
  limit: number,
): Promise<CandidateQuestion[]> {
  const rows = await db
    .select({
      questionId: questions.id,
      difficulty: questions.difficulty,
      estimatedSeconds: questions.estimatedSeconds,
      nodeId: syllabusNodes.id,
      nodeTitle: syllabusNodes.title,
    })
    .from(questionStates)
    .innerJoin(questions, eq(questions.id, questionStates.questionId))
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(
      and(
        eq(questionStates.userId, userId),
        eq(questionStates.lastResult, false),
        isNull(questionStates.graduatedAt),
        PUBLISHED,
      ),
    )
    .orderBy(desc(questionStates.lastAttemptedAt))
    .limit(limit);

  return rows.map((r) => ({
    questionId: r.questionId,
    nodeId: r.nodeId,
    nodeTitle: r.nodeTitle,
    difficulty: r.difficulty,
    estimatedSeconds: r.estimatedSeconds,
  }));
}

async function coverageCandidates(
  userId: string,
  unstarted: Awaited<ReturnType<typeof getUnstartedTopics>>,
): Promise<CandidateQuestion[]> {
  if (unstarted.length === 0) return [];

  const out: CandidateQuestion[] = [];
  for (const topic of unstarted) {
    const rows = await db
      .select({
        questionId: questions.id,
        difficulty: questions.difficulty,
        estimatedSeconds: questions.estimatedSeconds,
        nodeId: syllabusNodes.id,
      })
      .from(questions)
      .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
      .where(
        and(
          PUBLISHED,
          sql`${syllabusNodes.path} LIKE ${topic.path + '%'}`,
          ne(questions.difficulty, 'hard'), // don't open a new topic on a hard question
        ),
      )
      .orderBy(sql`random()`)
      .limit(4);

    out.push(
      ...rows.map((r) => ({
        questionId: r.questionId,
        nodeId: r.nodeId,
        nodeTitle: topic.title,
        difficulty: r.difficulty,
        estimatedSeconds: r.estimatedSeconds,
      })),
    );
  }
  return out;
}

/** For a student with no history whatsoever. */
async function starterCandidates(limit: number): Promise<CandidateQuestion[]> {
  const rows = await db
    .select({
      questionId: questions.id,
      difficulty: questions.difficulty,
      estimatedSeconds: questions.estimatedSeconds,
      nodeId: syllabusNodes.id,
      nodeTitle: syllabusNodes.title,
    })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(and(PUBLISHED, ne(questions.difficulty, 'hard')))
    .orderBy(sql`random()`)
    .limit(limit);

  return rows.map((r) => ({
    questionId: r.questionId,
    nodeId: r.nodeId,
    nodeTitle: r.nodeTitle,
    difficulty: r.difficulty,
    estimatedSeconds: r.estimatedSeconds,
  }));
}

/* ---------------- mistake book & bookmarks ---------------- */

export async function getMistakeBook(userId: string, limit = 50) {
  return db
    .select({
      questionId: questions.id,
      publicId: questions.publicId,
      stem: questions.stemMd,
      difficulty: questions.difficulty,
      nodeId: syllabusNodes.id,
      nodeTitle: syllabusNodes.title,
      nodeCode: syllabusNodes.code,
      attempts: questionStates.attempts,
      correctAttempts: questionStates.correctAttempts,
      box: questionStates.box,
      lastAttemptedAt: questionStates.lastAttemptedAt,
      nextReviewAt: questionStates.nextReviewAt,
    })
    .from(questionStates)
    .innerJoin(questions, eq(questions.id, questionStates.questionId))
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(
      and(
        eq(questionStates.userId, userId),
        isNull(questionStates.graduatedAt),
        sql`${questionStates.correctAttempts} < ${questionStates.attempts}`,
        PUBLISHED,
      ),
    )
    .orderBy(asc(questionStates.nextReviewAt))
    .limit(limit);
}

export async function getBookmarks(userId: string, limit = 50) {
  return db
    .select({
      questionId: questions.id,
      publicId: questions.publicId,
      stem: questions.stemMd,
      difficulty: questions.difficulty,
      nodeTitle: syllabusNodes.title,
      bookmarkedAt: questionStates.bookmarkedAt,
    })
    .from(questionStates)
    .innerJoin(questions, eq(questions.id, questionStates.questionId))
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(and(eq(questionStates.userId, userId), eq(questionStates.isBookmarked, true), PUBLISHED))
    .orderBy(desc(questionStates.bookmarkedAt))
    .limit(limit);
}

export async function toggleBookmark(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const [existing] = await db
    .select({ isBookmarked: questionStates.isBookmarked })
    .from(questionStates)
    .where(and(eq(questionStates.userId, userId), eq(questionStates.questionId, questionId)))
    .limit(1);

  const next = !(existing?.isBookmarked ?? false);

  await db
    .insert(questionStates)
    .values({
      userId,
      questionId,
      isBookmarked: next,
      bookmarkedAt: next ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [questionStates.userId, questionStates.questionId],
      set: { isBookmarked: next, bookmarkedAt: next ? new Date() : null },
    });

  return next;
}

export async function countMistakes(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(questionStates)
    .innerJoin(questions, eq(questions.id, questionStates.questionId))
    .where(
      and(
        eq(questionStates.userId, userId),
        isNull(questionStates.graduatedAt),
        sql`${questionStates.correctAttempts} < ${questionStates.attempts}`,
        PUBLISHED,
      ),
    );
  return Number(row?.n ?? 0);
}

export async function countDueReviews(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(questionStates)
    .innerJoin(questions, eq(questions.id, questionStates.questionId))
    .where(
      and(
        eq(questionStates.userId, userId),
        isNull(questionStates.graduatedAt),
        isNotNull(questionStates.nextReviewAt),
        lte(questionStates.nextReviewAt, new Date()),
        PUBLISHED,
      ),
    );
  return Number(row?.n ?? 0);
}
