import 'server-only';

import { and, eq, asc, desc, inArray, sql, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  practiceSessions,
  sessionQuestions,
  answers,
  questions,
  questionOptions,
  questionStates,
  dailyActivity,
  syllabusNodes,
} from '@/lib/db/schema';
import { gradeMcq, scoreSession } from '@/lib/domain/scoring';
import { reviewAfterAnswer, NEW_REVIEW_STATE, type ReviewState } from '@/lib/domain/scheduling';
import { getQuestionsForStudent, getQuestionsForGrading, type StudentQuestion } from './questions';
import { applyAnswerToMastery } from './mastery';

/**
 * The practice/exam engine.
 *
 * Every mode — quick practice, topic practice, a past paper, a timed mock —
 * runs through this one set of functions. Adding a mode means adding a way
 * to *choose questions*, not a new engine.
 */

export type PracticeMode =
  | 'calibration' | 'quick' | 'topic' | 'weak_areas' | 'recommended'
  | 'past_paper' | 'mock_exam' | 'mistakes' | 'bookmarks' | 'challenge';

export class SessionError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'SessionError';
  }
}

/* ------------------------------------------------------------------ *
 * Creation
 * ------------------------------------------------------------------ */

export async function createSession(input: {
  userId: string;
  mode: PracticeMode;
  questionIds: string[];
  /** Per-question reasons, for "from your weakest topic". */
  reasons?: Record<string, string>;
  syllabusNodeId?: string | null;
  paperId?: string | null;
  timeLimitSeconds?: number | null;
  /** Practice reveals answers immediately; exams withhold until submit. */
  revealAnswers?: boolean;
  config?: Record<string, unknown>;
}): Promise<string> {
  if (input.questionIds.length === 0) {
    throw new SessionError('There are no questions available for that selection.', 'no_questions');
  }

  const timeLimit = input.timeLimitSeconds ?? null;

  return db.transaction(async (tx) => {
    const [session] = await tx
      .insert(practiceSessions)
      .values({
        userId: input.userId,
        mode: input.mode,
        config: input.config ?? {},
        syllabusNodeId: input.syllabusNodeId ?? null,
        paperId: input.paperId ?? null,
        status: 'active',
        questionCount: input.questionIds.length,
        timeLimitSeconds: timeLimit,
        // Server-authoritative. The client clock is never consulted.
        expiresAt: timeLimit ? new Date(Date.now() + timeLimit * 1000) : null,
        revealAnswers: input.revealAnswers ?? true,
      })
      .returning();

    if (!session) throw new SessionError('Could not start the session.', 'create_failed');

    await tx.insert(sessionQuestions).values(
      input.questionIds.map((questionId, i) => ({
        sessionId: session.id,
        questionId,
        position: i,
        reason: input.reasons?.[questionId] ?? null,
      })),
    );

    return session.id;
  });
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

export type SessionView = {
  id: string;
  mode: PracticeMode;
  status: 'active' | 'submitted' | 'abandoned' | 'expired';
  questionCount: number;
  revealAnswers: boolean;
  timeLimitSeconds: number | null;
  expiresAt: Date | null;
  /** Server-computed. The countdown is rendered from this, not from the clock. */
  secondsRemaining: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  questions: Array<StudentQuestion & { position: number; reason: string | null }>;
  answers: Record<
    string,
    { selectedOptionIds: string[]; markedForReview: boolean; isCorrect: boolean | null }
  >;
};

/**
 * Load a session for its owner.
 *
 * `userId` is part of the WHERE clause rather than an assertion afterwards,
 * so another student's session id simply does not resolve.
 */
export async function getSession(
  sessionId: string,
  userId: string,
): Promise<SessionView | null> {
  const [session] = await db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.userId, userId)))
    .limit(1);

  if (!session) return null;

  const links = await db
    .select({
      questionId: sessionQuestions.questionId,
      position: sessionQuestions.position,
      reason: sessionQuestions.reason,
    })
    .from(sessionQuestions)
    .where(eq(sessionQuestions.sessionId, sessionId))
    .orderBy(asc(sessionQuestions.position));

  const orderedIds = links.map((l) => l.questionId);
  const studentQuestions = await getQuestionsForStudent(orderedIds);
  const metaById = new Map(links.map((l) => [l.questionId, l]));

  const answerRows = await db
    .select({
      questionId: answers.questionId,
      selectedOptionIds: answers.selectedOptionIds,
      markedForReview: answers.markedForReview,
      isCorrect: answers.isCorrect,
    })
    .from(answers)
    .where(eq(answers.sessionId, sessionId));

  const answerMap: SessionView['answers'] = {};
  for (const a of answerRows) {
    answerMap[a.questionId] = {
      selectedOptionIds: a.selectedOptionIds ?? [],
      markedForReview: a.markedForReview,
      // Correctness is withheld for an exam still in progress.
      isCorrect: session.revealAnswers || session.status !== 'active' ? a.isCorrect : null,
    };
  }

  const secondsRemaining = session.expiresAt
    ? Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000))
    : null;

  return {
    id: session.id,
    mode: session.mode,
    status: session.status,
    questionCount: session.questionCount,
    revealAnswers: session.revealAnswers,
    timeLimitSeconds: session.timeLimitSeconds,
    expiresAt: session.expiresAt,
    secondsRemaining,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
    score: session.score,
    maxScore: session.maxScore,
    questions: studentQuestions.map((q) => ({
      ...q,
      position: metaById.get(q.id)?.position ?? 0,
      reason: metaById.get(q.id)?.reason ?? null,
    })),
    answers: answerMap,
  };
}

/* ------------------------------------------------------------------ *
 * Answering
 * ------------------------------------------------------------------ */

export type AnswerOutcome = {
  isCorrect: boolean;
  /** Only populated when the session reveals answers immediately. */
  feedback: {
    correctOptionIds: string[];
    explanation: string | null;
    examTip: string | null;
    /** Why the option they actually chose is wrong. */
    misconception: string | null;
    answerConfidence: 'official_key' | 'expert_verified' | 'unverified';
  } | null;
};

/**
 * Record and grade one answer.
 *
 * All grading is server-side and the correct option ids never travel to the
 * client until after the answer is recorded — and then only for a session
 * that reveals answers.
 */
export async function submitAnswer(input: {
  sessionId: string;
  userId: string;
  questionId: string;
  selectedOptionIds: string[];
  timeSpentMs?: number;
  markedForReview?: boolean;
}): Promise<AnswerOutcome> {
  const [session] = await db
    .select()
    .from(practiceSessions)
    .where(
      and(eq(practiceSessions.id, input.sessionId), eq(practiceSessions.userId, input.userId)),
    )
    .limit(1);

  if (!session) throw new SessionError('Session not found.', 'not_found');
  if (session.status !== 'active') {
    throw new SessionError('This session has already been submitted.', 'not_active');
  }
  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await expireSession(session.id);
    throw new SessionError('Time is up for this exam.', 'expired');
  }

  // The question must actually belong to this session.
  const [link] = await db
    .select({ id: sessionQuestions.id })
    .from(sessionQuestions)
    .where(
      and(
        eq(sessionQuestions.sessionId, input.sessionId),
        eq(sessionQuestions.questionId, input.questionId),
      ),
    )
    .limit(1);

  if (!link) throw new SessionError('That question is not part of this session.', 'not_in_session');

  const [question] = await db
    .select({
      id: questions.id,
      marks: questions.marks,
      difficulty: questions.difficulty,
      nodeId: questions.syllabusNodeId,
      explanation: questions.explanationMd,
      examTip: questions.examTipMd,
      answerConfidence: questions.answerConfidence,
    })
    .from(questions)
    .where(eq(questions.id, input.questionId))
    .limit(1);

  if (!question) throw new SessionError('Question not found.', 'question_missing');

  const options = await db
    .select({
      id: questionOptions.id,
      isCorrect: questionOptions.isCorrect,
      misconception: questionOptions.misconceptionMd,
    })
    .from(questionOptions)
    .where(eq(questionOptions.questionId, input.questionId));

  const grade = gradeMcq(options, input.selectedOptionIds, question.marks);

  await db.transaction(async (tx) => {
    await tx
      .insert(answers)
      .values({
        sessionId: input.sessionId,
        questionId: input.questionId,
        userId: input.userId,
        selectedOptionIds: input.selectedOptionIds,
        isCorrect: grade.isCorrect,
        awardedMarks: grade.awardedMarks,
        timeSpentMs: input.timeSpentMs ?? null,
        markedForReview: input.markedForReview ?? false,
      })
      .onConflictDoUpdate({
        target: [answers.sessionId, answers.questionId],
        set: {
          selectedOptionIds: input.selectedOptionIds,
          isCorrect: grade.isCorrect,
          awardedMarks: grade.awardedMarks,
          timeSpentMs: input.timeSpentMs ?? null,
          markedForReview: input.markedForReview ?? false,
          changedCount: sql`${answers.changedCount} + 1`,
          answeredAt: new Date(),
        },
      });

    await updateQuestionState(tx, input.userId, input.questionId, grade.isCorrect);
    await bumpDailyActivity(tx, input.userId, grade.isCorrect, input.timeSpentMs ?? 0);
  });

  // Mastery is updated outside the answer transaction: it touches several
  // ancestor rows, and a contention failure there must not lose the answer.
  await applyAnswerToMastery({
    userId: input.userId,
    nodeId: question.nodeId,
    correct: grade.isCorrect,
    difficulty: question.difficulty,
  });

  if (!session.revealAnswers) {
    return { isCorrect: grade.isCorrect, feedback: null };
  }

  const chosen = input.selectedOptionIds[0];
  const chosenOption = options.find((o) => o.id === chosen);

  return {
    isCorrect: grade.isCorrect,
    feedback: {
      correctOptionIds: grade.correctOptionIds,
      explanation: question.explanation,
      examTip: question.examTip,
      misconception: grade.isCorrect ? null : (chosenOption?.misconception ?? null),
      answerConfidence: question.answerConfidence,
    },
  };
}

/** Leitner state, per student per question. */
async function updateQuestionState(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  questionId: string,
  correct: boolean,
) {
  const [existing] = await tx
    .select()
    .from(questionStates)
    .where(and(eq(questionStates.userId, userId), eq(questionStates.questionId, questionId)))
    .limit(1);

  const current: ReviewState = existing
    ? {
        box: existing.box,
        attempts: existing.attempts,
        correctAttempts: existing.correctAttempts,
        consecutiveCorrect: existing.consecutiveCorrect,
        lastResult: existing.lastResult,
        nextReviewAt: existing.nextReviewAt,
        graduatedAt: existing.graduatedAt,
      }
    : NEW_REVIEW_STATE;

  const next = reviewAfterAnswer(current, correct);

  await tx
    .insert(questionStates)
    .values({
      userId,
      questionId,
      box: next.box,
      attempts: next.attempts,
      correctAttempts: next.correctAttempts,
      consecutiveCorrect: next.consecutiveCorrect,
      lastResult: next.lastResult,
      lastAttemptedAt: new Date(),
      nextReviewAt: next.nextReviewAt,
      graduatedAt: next.graduatedAt,
      isBookmarked: existing?.isBookmarked ?? false,
    })
    .onConflictDoUpdate({
      target: [questionStates.userId, questionStates.questionId],
      set: {
        box: next.box,
        attempts: next.attempts,
        correctAttempts: next.correctAttempts,
        consecutiveCorrect: next.consecutiveCorrect,
        lastResult: next.lastResult,
        lastAttemptedAt: new Date(),
        nextReviewAt: next.nextReviewAt,
        graduatedAt: next.graduatedAt,
      },
    });
}

async function bumpDailyActivity(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  correct: boolean,
  timeSpentMs: number,
) {
  const today = new Date().toISOString().slice(0, 10);
  await tx
    .insert(dailyActivity)
    .values({
      userId,
      activityDate: today,
      answered: 1,
      correct: correct ? 1 : 0,
      secondsSpent: Math.round(timeSpentMs / 1000),
      sessions: 0,
    })
    .onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.activityDate],
      set: {
        answered: sql`${dailyActivity.answered} + 1`,
        correct: sql`${dailyActivity.correct} + ${correct ? 1 : 0}`,
        secondsSpent: sql`${dailyActivity.secondsSpent} + ${Math.round(timeSpentMs / 1000)}`,
      },
    });
}

export async function toggleMarkForReview(input: {
  sessionId: string;
  userId: string;
  questionId: string;
  marked: boolean;
}): Promise<void> {
  await db
    .insert(answers)
    .values({
      sessionId: input.sessionId,
      questionId: input.questionId,
      userId: input.userId,
      selectedOptionIds: [],
      markedForReview: input.marked,
      isCorrect: null,
    })
    .onConflictDoUpdate({
      target: [answers.sessionId, answers.questionId],
      set: { markedForReview: input.marked },
    });
}

/* ------------------------------------------------------------------ *
 * Submission
 * ------------------------------------------------------------------ */

export type SessionResult = {
  score: number;
  maxScore: number;
  percentage: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  byTopic: Array<{ nodeId: string; title: string; correct: number; total: number }>;
};

export async function submitSession(
  sessionId: string,
  userId: string,
): Promise<SessionResult> {
  const [session] = await db
    .select()
    .from(practiceSessions)
    .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.userId, userId)))
    .limit(1);

  if (!session) throw new SessionError('Session not found.', 'not_found');

  const rows = await db
    .select({
      questionId: sessionQuestions.questionId,
      marks: questions.marks,
      nodeId: syllabusNodes.id,
      nodeTitle: syllabusNodes.title,
      isCorrect: answers.isCorrect,
      awardedMarks: answers.awardedMarks,
    })
    .from(sessionQuestions)
    .innerJoin(questions, eq(questions.id, sessionQuestions.questionId))
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .leftJoin(
      answers,
      and(
        eq(answers.sessionId, sessionQuestions.sessionId),
        eq(answers.questionId, sessionQuestions.questionId),
      ),
    )
    .where(eq(sessionQuestions.sessionId, sessionId));

  const score = scoreSession(
    rows.map((r) => ({
      isCorrect: r.isCorrect,
      awardedMarks: r.awardedMarks,
      marks: r.marks,
    })),
  );

  const topicMap = new Map<string, { nodeId: string; title: string; correct: number; total: number }>();
  for (const r of rows) {
    const entry = topicMap.get(r.nodeId) ?? {
      nodeId: r.nodeId,
      title: r.nodeTitle,
      correct: 0,
      total: 0,
    };
    entry.total += 1;
    if (r.isCorrect) entry.correct += 1;
    topicMap.set(r.nodeId, entry);
  }

  if (session.status === 'active') {
    await db
      .update(practiceSessions)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        score: score.score,
        maxScore: score.maxScore,
        timeSpentMs: Date.now() - session.startedAt.getTime(),
      })
      .where(eq(practiceSessions.id, sessionId));

    await db
      .insert(dailyActivity)
      .values({
        userId,
        activityDate: new Date().toISOString().slice(0, 10),
        sessions: 1,
      })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.activityDate],
        set: { sessions: sql`${dailyActivity.sessions} + 1` },
      });
  }

  return { ...score, byTopic: [...topicMap.values()].sort((a, b) => b.total - a.total) };
}

async function expireSession(sessionId: string) {
  await db
    .update(practiceSessions)
    .set({ status: 'expired', submittedAt: new Date() })
    .where(and(eq(practiceSessions.id, sessionId), eq(practiceSessions.status, 'active')));
}

/** Post-submission review: the student has earned the explanations. */
export async function getSessionReview(sessionId: string, userId: string) {
  const session = await getSession(sessionId, userId);
  if (!session) return null;

  const graded = await getQuestionsForGrading(session.questions.map((q) => q.id));
  const byId = new Map(graded.map((g) => [g.id, g]));

  return {
    session,
    items: session.questions.map((q) => {
      const full = byId.get(q.id);
      const answer = session.answers[q.id];
      const chosen = answer?.selectedOptionIds[0];
      return {
        question: full ?? null,
        selectedOptionIds: answer?.selectedOptionIds ?? [],
        isCorrect: answer?.isCorrect ?? null,
        misconception:
          chosen && full
            ? (full.options.find((o) => o.id === chosen)?.misconception ?? null)
            : null,
      };
    }),
  };
}

export async function getRecentSessions(userId: string, limit = 5) {
  return db
    .select({
      id: practiceSessions.id,
      mode: practiceSessions.mode,
      status: practiceSessions.status,
      questionCount: practiceSessions.questionCount,
      score: practiceSessions.score,
      maxScore: practiceSessions.maxScore,
      startedAt: practiceSessions.startedAt,
      submittedAt: practiceSessions.submittedAt,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId))
    .orderBy(desc(practiceSessions.startedAt))
    .limit(limit);
}

export async function getActiveSession(userId: string) {
  const [row] = await db
    .select({ id: practiceSessions.id, mode: practiceSessions.mode })
    .from(practiceSessions)
    .where(and(eq(practiceSessions.userId, userId), eq(practiceSessions.status, 'active')))
    .orderBy(desc(practiceSessions.startedAt))
    .limit(1);
  return row ?? null;
}
