import 'server-only';

import { and, eq, desc, asc, sql, inArray, isNull, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  questions,
  questionOptions,
  questionReviews,
  questionVersions,
  auditLogs,
  syllabusNodes,
  examPapers,
  profiles,
  contentReports,
  questionStats,
} from '@/lib/db/schema';
import type { Role } from '@/lib/auth/rbac';

/**
 * The editorial workflow.
 *
 * Two rules are enforced here rather than in the UI, because the UI is not
 * where correctness lives:
 *
 *   1. A past-paper question needs TWO DISTINCT approvers. This is a rule
 *      about people, not roles, so it cannot be expressed in the RBAC matrix.
 *   2. Nothing is published without a verified answer key and an explanation.
 *      The database enforces this too — belt and braces, because publishing
 *      a wrong answer is the worst thing this platform could do.
 */

export class ReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewError';
  }
}

export type ReviewQueueItem = {
  id: string;
  publicId: string;
  stem: string;
  status: string;
  answerConfidence: string;
  sourceType: string;
  topicCode: string;
  topicTitle: string;
  paperLabel: string | null;
  optionCount: number;
  hasKey: boolean;
  hasExplanation: boolean;
  /** The current explanation, so the queue can edit it in place. */
  explanation: string | null;
  approvals: number;
  updatedAt: Date;
  /** A figure was recovered from the paper and attached to this question. */
  hasFigure: boolean;
};

/**
 * Which slice of the queue to show.
 *
 * The queue is 529 questions and the page takes 50, so without a filter the
 * reviewer only ever sees the oldest paper. Every recovered figure sits on a
 * 2020+ paper — the first one is at position 314 — which made them
 * unreachable through the UI entirely.
 */
export type ReviewQueueFilters = {
  /** Restrict to one paper year. */
  year?: number;
  /** Only questions that carry a figure, or only those that do not. */
  hasFigure?: boolean;
};

/** Paper years that currently have anything in the queue, newest first. */
export async function getReviewQueueYears(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ year: examPapers.year })
    .from(questions)
    .innerJoin(examPapers, eq(examPapers.id, questions.paperId))
    .where(
      and(
        inArray(questions.status, ['draft', 'in_review', 'approved']),
        isNull(questions.deletedAt),
      ),
    )
    .orderBy(desc(examPapers.year));
  return rows.map((r) => r.year);
}

/** How many questions in the queue carry a figure — drives the filter's label. */
export async function countQueueWithFigures(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(questions)
    .where(
      and(
        inArray(questions.status, ['draft', 'in_review', 'approved']),
        isNull(questions.deletedAt),
        sql`${questions.stimulusId} IS NOT NULL`,
      ),
    );
  return row?.n ?? 0;
}

export async function getReviewQueue(
  limit = 50,
  filters: ReviewQueueFilters = {},
): Promise<ReviewQueueItem[]> {
  const rows = await db
    .select({
      id: questions.id,
      publicId: questions.publicId,
      stem: questions.stemMd,
      status: questions.status,
      answerConfidence: questions.answerConfidence,
      sourceType: questions.sourceType,
      updatedAt: questions.updatedAt,
      topicCode: syllabusNodes.code,
      topicTitle: syllabusNodes.title,
      explanation: questions.explanationMd,
      paperYear: examPapers.year,
      paperNo: examPapers.paperNo,
      questionNumber: questions.questionNumber,
      stimulusId: questions.stimulusId,
    })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .leftJoin(examPapers, eq(examPapers.id, questions.paperId))
    .where(
      and(
        inArray(questions.status, ['draft', 'in_review', 'approved']),
        isNull(questions.deletedAt),
        ...(filters.year !== undefined ? [eq(examPapers.year, filters.year)] : []),
        ...(filters.hasFigure === true
          ? [sql`${questions.stimulusId} IS NOT NULL`]
          : filters.hasFigure === false
            ? [isNull(questions.stimulusId)]
            : []),
      ),
    )
    /*
     * Stable ordering, deliberately NOT by updatedAt.
     *
     * Ordering by recency means the question you just saved a key for jumps
     * to the top and shoves everything else down — so a reviewer working
     * through a paper loses their place after every single save. Ordering by
     * the paper and question number keeps the queue still under their hands.
     */
    .orderBy(asc(examPapers.year), asc(questions.questionNumber), asc(questions.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  const optionRows = await db
    .select({
      questionId: questionOptions.questionId,
      isCorrect: questionOptions.isCorrect,
    })
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, ids));

  const approvalRows = await db
    .select({
      questionId: questionReviews.questionId,
      reviewerId: questionReviews.reviewerId,
    })
    .from(questionReviews)
    .where(
      and(inArray(questionReviews.questionId, ids), eq(questionReviews.action, 'approve')),
    );

  return rows.map((r) => {
    const opts = optionRows.filter((o) => o.questionId === r.id);
    const approvers = new Set(
      approvalRows.filter((a) => a.questionId === r.id).map((a) => a.reviewerId),
    );

    return {
      id: r.id,
      publicId: r.publicId,
      stem: r.stem,
      status: r.status,
      answerConfidence: r.answerConfidence,
      sourceType: r.sourceType,
      topicCode: r.topicCode,
      topicTitle: r.topicTitle,
      paperLabel:
        r.paperYear !== null
          ? `${r.paperYear} P${r.paperNo}${r.questionNumber ? ` Q${r.questionNumber}` : ''}`
          : null,
      optionCount: opts.length,
      hasKey: opts.some((o) => o.isCorrect),
      hasExplanation: Boolean(r.explanation),
      explanation: r.explanation,
      approvals: approvers.size,
      updatedAt: r.updatedAt,
      hasFigure: r.stimulusId !== null,
    };
  });
}

/** Set which option is correct, and record how confident we are in it. */
export async function setAnswerKey(input: {
  questionId: string;
  correctOptionId: string;
  confidence: 'official_key' | 'expert_verified';
  actorId: string;
  note?: string;
}): Promise<void> {
  const options = await db
    .select({ id: questionOptions.id })
    .from(questionOptions)
    .where(eq(questionOptions.questionId, input.questionId));

  if (!options.some((o) => o.id === input.correctOptionId)) {
    throw new ReviewError('That option does not belong to this question.');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(questionOptions)
      .set({ isCorrect: false })
      .where(eq(questionOptions.questionId, input.questionId));

    await tx
      .update(questionOptions)
      .set({ isCorrect: true })
      .where(eq(questionOptions.id, input.correctOptionId));

    await tx
      .update(questions)
      .set({
        answerConfidence: input.confidence,
        updatedBy: input.actorId,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, input.questionId));

    await tx.insert(auditLogs).values({
      actorId: input.actorId,
      action: 'question.set_answer_key',
      entityType: 'question',
      entityId: input.questionId,
      after: { correctOptionId: input.correctOptionId, confidence: input.confidence },
    });
  });
}

/**
 * Write or replace a question's explanation.
 *
 * Publishing refuses a question without one, so the queue has to be able to
 * write it. Audited like the answer key, with the previous text kept in the
 * log so an overwrite can be recovered.
 */
export async function setExplanation(input: {
  questionId: string;
  explanationMd: string;
  actorId: string;
}): Promise<void> {
  const text = input.explanationMd.trim();
  if (!text) throw new ReviewError('Write an explanation before saving.');

  const [question] = await db
    .select({ id: questions.id, explanationMd: questions.explanationMd })
    .from(questions)
    .where(eq(questions.id, input.questionId))
    .limit(1);

  if (!question) throw new ReviewError('Question not found.');

  await db.transaction(async (tx) => {
    await tx
      .update(questions)
      .set({ explanationMd: text, updatedBy: input.actorId, updatedAt: new Date() })
      .where(eq(questions.id, input.questionId));

    await tx.insert(auditLogs).values({
      actorId: input.actorId,
      action: 'question.set_explanation',
      entityType: 'question',
      entityId: input.questionId,
      before: { explanationMd: question.explanationMd },
      after: { explanationMd: text },
    });
  });
}

export async function transitionQuestion(input: {
  questionId: string;
  action: 'submit' | 'approve' | 'reject' | 'request_changes' | 'publish' | 'unpublish';
  actorId: string;
  actorRole: Role;
  note?: string;
}): Promise<{ status: string; message: string }> {
  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, input.questionId))
    .limit(1);

  if (!question) throw new ReviewError('Question not found.');

  const options = await db
    .select({ isCorrect: questionOptions.isCorrect })
    .from(questionOptions)
    .where(eq(questionOptions.questionId, input.questionId));

  let nextStatus = question.status;
  let message = '';

  switch (input.action) {
    case 'submit':
      nextStatus = 'in_review';
      message = 'Sent for review.';
      break;

    case 'request_changes':
      nextStatus = 'draft';
      message = 'Sent back to the author.';
      break;

    case 'reject':
      nextStatus = 'rejected';
      message = 'Rejected.';
      break;

    case 'approve': {
      if (!options.some((o) => o.isCorrect)) {
        throw new ReviewError('Set the answer key before approving this question.');
      }
      if (question.answerConfidence === 'unverified') {
        throw new ReviewError(
          'The answer is still marked unverified. Set the answer key and its confidence first.',
        );
      }

      // Count distinct prior approvers, excluding this one.
      const priorApprovals = await db
        .selectDistinct({ reviewerId: questionReviews.reviewerId })
        .from(questionReviews)
        .where(
          and(
            eq(questionReviews.questionId, input.questionId),
            eq(questionReviews.action, 'approve'),
          ),
        );

      const others = priorApprovals.filter((a) => a.reviewerId !== input.actorId).length;
      const needed = question.sourceType === 'past_paper' ? 2 : 1;
      const total = others + 1;

      nextStatus = 'approved';
      message =
        total >= needed
          ? `Approved. ${total} of ${needed} approvals — ready to publish.`
          : `Approved by you. Needs ${needed - total} more independent approval before publishing.`;
      break;
    }

    case 'publish': {
      if (!question.explanationMd) {
        throw new ReviewError('A published question must have an explanation.');
      }
      if (question.answerConfidence === 'unverified') {
        throw new ReviewError('An unverified answer cannot be published.');
      }
      if (!options.some((o) => o.isCorrect)) {
        throw new ReviewError('This question has no answer key.');
      }

      if (question.sourceType === 'past_paper') {
        const approvers = await db
          .selectDistinct({ reviewerId: questionReviews.reviewerId })
          .from(questionReviews)
          .where(
            and(
              eq(questionReviews.questionId, input.questionId),
              eq(questionReviews.action, 'approve'),
            ),
          );

        if (approvers.length < 2) {
          throw new ReviewError(
            `Past-paper questions need two independent approvals before publishing. This one has ${approvers.length}.`,
          );
        }
      }

      nextStatus = 'published';
      message = 'Published.';
      break;
    }

    case 'unpublish':
      nextStatus = 'archived';
      message = 'Withdrawn from students.';
      break;
  }

  await db.transaction(async (tx) => {
    // Snapshot before the change, so every version is recoverable.
    await tx.insert(questionVersions).values({
      questionId: question.id,
      version: question.version,
      snapshot: question as unknown as Record<string, unknown>,
      changedBy: input.actorId,
      changeNote: input.note ?? input.action,
    });

    await tx
      .update(questions)
      .set({
        status: nextStatus,
        version: question.version + 1,
        updatedBy: input.actorId,
        updatedAt: new Date(),
        reviewedBy: input.action === 'approve' ? input.actorId : question.reviewedBy,
        publishedAt: nextStatus === 'published' ? new Date() : question.publishedAt,
      })
      .where(eq(questions.id, question.id));

    await tx.insert(questionReviews).values({
      questionId: question.id,
      reviewerId: input.actorId,
      action: input.action,
      note: input.note ?? null,
    });

    await tx.insert(auditLogs).values({
      actorId: input.actorId,
      action: `question.${input.action}`,
      entityType: 'question',
      entityId: question.id,
      before: { status: question.status },
      after: { status: nextStatus },
    });
  });

  return { status: nextStatus, message };
}

/* ---------------- admin dashboards ---------------- */

export async function getContentStats() {
  const rows = await db
    .select({
      status: questions.status,
      sourceType: questions.sourceType,
      confidence: questions.answerConfidence,
      n: count(),
    })
    .from(questions)
    .where(isNull(questions.deletedAt))
    .groupBy(questions.status, questions.sourceType, questions.answerConfidence);

  const total = rows.reduce((s, r) => s + Number(r.n), 0);
  const published = rows.filter((r) => r.status === 'published').reduce((s, r) => s + Number(r.n), 0);
  const awaitingKey = rows
    .filter((r) => r.confidence === 'unverified')
    .reduce((s, r) => s + Number(r.n), 0);
  const inReview = rows
    .filter((r) => r.status === 'in_review' || r.status === 'draft')
    .reduce((s, r) => s + Number(r.n), 0);

  return { total, published, awaitingKey, inReview, breakdown: rows };
}

/** Questions whose statistics suggest they are broken. */
export async function getSuspectQuestions(limit = 20) {
  return db
    .select({
      id: questions.id,
      publicId: questions.publicId,
      stem: questions.stemMd,
      attempts: questionStats.attempts,
      pValue: questionStats.pValue,
      discrimination: questionStats.discrimination,
    })
    .from(questionStats)
    .innerJoin(questions, eq(questions.id, questionStats.questionId))
    .where(sql`${questionStats.attempts} >= 30 AND ${questionStats.discrimination} < 0.05`)
    .orderBy(asc(questionStats.discrimination))
    .limit(limit);
}

export async function getOpenReports(limit = 30) {
  return db
    .select({
      id: contentReports.id,
      reason: contentReports.reason,
      detail: contentReports.detail,
      createdAt: contentReports.createdAt,
      questionId: questions.id,
      publicId: questions.publicId,
      stem: questions.stemMd,
    })
    .from(contentReports)
    .innerJoin(questions, eq(questions.id, contentReports.questionId))
    .where(eq(contentReports.status, 'open'))
    .orderBy(desc(contentReports.createdAt))
    .limit(limit);
}
