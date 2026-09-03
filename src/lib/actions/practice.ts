'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { selectQuestions } from '@/lib/services/questions';
import {
  createSession,
  submitAnswer,
  submitSession,
  toggleMarkForReview,
  SessionError,
} from '@/lib/services/sessions';
import { getRecommendation, toggleBookmark, getMistakeBook } from '@/lib/services/recommendations';
import { db } from '@/lib/db/client';
import { syllabusNodes, questionStates, questions } from '@/lib/db/schema';
import { and, eq, isNull, sql, asc, lte, isNotNull } from 'drizzle-orm';

/**
 * Server Actions for practice.
 *
 * Every one of these begins with `requireUser()` and passes that user id
 * into the service — never a user id supplied by the client.
 */

const QUICK_SIZE = 10;

export async function startQuickPractice() {
  const user = await requireUser();

  const limit = await checkRateLimit(`session:${user.id}`, 30, 3600);
  if (!limit.allowed) throw new SessionError('Slow down a moment — try again shortly.', 'rate_limited');

  const questionIds = await selectQuestions({ limit: QUICK_SIZE });
  const id = await createSession({ userId: user.id, mode: 'quick', questionIds });
  redirect(`/session/${id}`);
}

export async function startRecommendedPractice() {
  const user = await requireUser();

  const recommendation = await getRecommendation(user.id, 15);
  if (recommendation.totalQuestions === 0) {
    return startQuickPractice();
  }

  const reasons: Record<string, string> = {};
  for (const item of recommendation.items) reasons[item.questionId] = item.reason;

  const id = await createSession({
    userId: user.id,
    mode: 'recommended',
    questionIds: recommendation.items.map((i) => i.questionId),
    reasons,
    config: { breakdown: recommendation.breakdown },
  });
  redirect(`/session/${id}`);
}

export async function startTopicPractice(formData: FormData) {
  const user = await requireUser();
  const nodeId = z.string().uuid().parse(formData.get('nodeId'));

  const [node] = await db
    .select({ path: syllabusNodes.path, title: syllabusNodes.title })
    .from(syllabusNodes)
    .where(eq(syllabusNodes.id, nodeId))
    .limit(1);

  if (!node) throw new SessionError('That topic does not exist.', 'no_topic');

  const questionIds = await selectQuestions({ limit: 10, pathPrefix: node.path });
  const id = await createSession({
    userId: user.id,
    mode: 'topic',
    questionIds,
    syllabusNodeId: nodeId,
    reasons: Object.fromEntries(questionIds.map((q) => [q, `From ${node.title}`])),
  });
  redirect(`/session/${id}`);
}

export async function startMistakePractice() {
  const user = await requireUser();

  const book = await getMistakeBook(user.id, 15);
  if (book.length === 0) redirect('/mistakes');

  const questionIds = book.map((m) => m.questionId);
  const id = await createSession({
    userId: user.id,
    mode: 'mistakes',
    questionIds,
    reasons: Object.fromEntries(questionIds.map((q) => [q, 'You got this wrong before'])),
  });
  redirect(`/session/${id}`);
}

export async function startWeakAreaPractice() {
  const user = await requireUser();

  const recommendation = await getRecommendation(user.id, 10);
  const weak = recommendation.items.filter((i) => i.slot === 'weak_topic');

  if (weak.length === 0) return startRecommendedPractice();

  const id = await createSession({
    userId: user.id,
    mode: 'weak_areas',
    questionIds: weak.map((i) => i.questionId),
    reasons: Object.fromEntries(weak.map((i) => [i.questionId, i.reason])),
  });
  redirect(`/session/${id}`);
}

export async function startChallengePractice() {
  const user = await requireUser();
  const questionIds = await selectQuestions({ limit: 10, difficulty: ['hard', 'medium'] });
  const id = await createSession({
    userId: user.id,
    mode: 'challenge',
    questionIds,
    reasons: Object.fromEntries(questionIds.map((q) => [q, 'Challenge question'])),
  });
  redirect(`/session/${id}`);
}

/* ---------------- in-session ---------------- */

const answerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).max(6),
  timeSpentMs: z.number().int().min(0).max(3_600_000).optional(),
});

export async function submitAnswerAction(input: z.infer<typeof answerSchema>) {
  const user = await requireUser();
  const parsed = answerSchema.parse(input);

  return submitAnswer({
    sessionId: parsed.sessionId,
    userId: user.id,
    questionId: parsed.questionId,
    selectedOptionIds: parsed.optionIds,
    timeSpentMs: parsed.timeSpentMs,
  });
}

export async function markForReviewAction(input: {
  sessionId: string;
  questionId: string;
  marked: boolean;
}) {
  const user = await requireUser();
  await toggleMarkForReview({
    sessionId: z.string().uuid().parse(input.sessionId),
    userId: user.id,
    questionId: z.string().uuid().parse(input.questionId),
    marked: Boolean(input.marked),
  });
}

export async function toggleBookmarkAction(questionId: string) {
  const user = await requireUser();
  return toggleBookmark(user.id, z.string().uuid().parse(questionId));
}

export async function submitSessionAction(sessionId: string) {
  const user = await requireUser();
  const id = z.string().uuid().parse(sessionId);
  await submitSession(id, user.id);
  redirect(`/session/${id}/review`);
}
