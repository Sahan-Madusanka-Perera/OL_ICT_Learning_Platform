import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, inArray } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { profiles, questionStates, nodeMastery, dailyActivity, answers } from '@/lib/db/schema';
import { selectQuestions, getQuestionsForGrading } from './questions';
import {
  createSession,
  getSession,
  submitAnswer,
  submitSession,
  getSessionReview,
  SessionError,
} from './sessions';
import { getWeakTopics, getAnswerCounts } from './mastery';
import { getMistakeBook, countMistakes, toggleBookmark, getBookmarks } from './recommendations';

/**
 * End-to-end exercise of the learning loop against a real database:
 * create a session, answer, grade, update mastery, land in the mistake book.
 *
 * Uses throwaway users that are deleted afterwards, so it does not disturb
 * the seeded demo accounts.
 */

let alice = '';
let bob = '';
let questionIds: string[] = [];

async function makeUser(name: string): Promise<string> {
  const [row] = await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      displayName: name,
      email: `${name.toLowerCase()}-${Date.now()}@test.invalid`,
      role: 'student',
      grade: 11,
    })
    .returning();
  return row!.id;
}

beforeAll(async () => {
  alice = await makeUser('TestAlice');
  bob = await makeUser('TestBob');
  questionIds = await selectQuestions({ limit: 6 });
  expect(questionIds.length).toBeGreaterThanOrEqual(4);
});

afterAll(async () => {
  // Cascades clean up sessions, answers, mastery and states.
  await db.delete(profiles).where(inArray(profiles.id, [alice, bob]));
});

describe('a practice session, end to end', () => {
  it('creates a session that serves the questions in the order chosen', async () => {
    const id = await createSession({
      userId: alice,
      mode: 'quick',
      questionIds,
      reasons: { [questionIds[0]!]: 'from your weakest topic' },
    });

    const session = await getSession(id, alice);
    expect(session).not.toBeNull();
    expect(session!.questions.map((q) => q.id)).toEqual(questionIds);
    expect(session!.status).toBe('active');
    expect(session!.questions[0]!.reason).toBe('from your weakest topic');
  });

  it('refuses to create a session with no questions', async () => {
    await expect(
      createSession({ userId: alice, mode: 'quick', questionIds: [] }),
    ).rejects.toThrow(SessionError);
  });

  it('grades a correct answer and returns the explanation', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds });
    const [graded] = await getQuestionsForGrading([questionIds[0]!]);
    const correctId = graded!.options.find((o) => o.isCorrect)!.id;

    const outcome = await submitAnswer({
      sessionId: id,
      userId: alice,
      questionId: questionIds[0]!,
      selectedOptionIds: [correctId],
      timeSpentMs: 4200,
    });

    expect(outcome.isCorrect).toBe(true);
    expect(outcome.feedback).not.toBeNull();
    expect(outcome.feedback!.explanation).toBeTruthy();
    expect(outcome.feedback!.correctOptionIds).toEqual([correctId]);
    expect(outcome.feedback!.misconception).toBeNull(); // they got it right
  });

  it('grades a wrong answer and explains the specific misconception', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds });
    const [graded] = await getQuestionsForGrading([questionIds[1]!]);
    const wrong = graded!.options.find((o) => !o.isCorrect)!;

    const outcome = await submitAnswer({
      sessionId: id,
      userId: alice,
      questionId: questionIds[1]!,
      selectedOptionIds: [wrong.id],
    });

    expect(outcome.isCorrect).toBe(false);
    expect(outcome.feedback!.misconception).toBe(wrong.misconception);
  });

  it('lets an answer be changed, and counts the change', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds });
    const [graded] = await getQuestionsForGrading([questionIds[2]!]);
    const wrong = graded!.options.find((o) => !o.isCorrect)!.id;
    const right = graded!.options.find((o) => o.isCorrect)!.id;

    await submitAnswer({ sessionId: id, userId: alice, questionId: questionIds[2]!, selectedOptionIds: [wrong] });
    const second = await submitAnswer({
      sessionId: id, userId: alice, questionId: questionIds[2]!, selectedOptionIds: [right],
    });

    expect(second.isCorrect).toBe(true);

    const [row] = await db
      .select({ changedCount: answers.changedCount })
      .from(answers)
      .where(and(eq(answers.sessionId, id), eq(answers.questionId, questionIds[2]!)));
    expect(row!.changedCount).toBe(1);
  });

  it('scores a submitted session and breaks it down by topic', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds: questionIds.slice(0, 4) });
    const graded = await getQuestionsForGrading(questionIds.slice(0, 4));

    // Two right, one wrong, one left blank.
    for (const [i, q] of graded.entries()) {
      if (i === 3) continue;
      const opt = i < 2
        ? q.options.find((o) => o.isCorrect)!.id
        : q.options.find((o) => !o.isCorrect)!.id;
      await submitAnswer({ sessionId: id, userId: alice, questionId: q.id, selectedOptionIds: [opt] });
    }

    const result = await submitSession(id, alice);
    expect(result.correct).toBe(2);
    expect(result.incorrect).toBe(1);
    expect(result.unanswered).toBe(1);
    expect(result.maxScore).toBe(4);
    expect(result.score).toBe(2);
    expect(result.percentage).toBe(50);
    expect(result.byTopic.length).toBeGreaterThan(0);
    expect(result.byTopic.reduce((s, t) => s + t.total, 0)).toBe(4);
  });

  it('rejects answers after the session is submitted', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds: questionIds.slice(0, 2) });
    await submitSession(id, alice);

    await expect(
      submitAnswer({ sessionId: id, userId: alice, questionId: questionIds[0]!, selectedOptionIds: [] }),
    ).rejects.toThrow(/already been submitted/);
  });

  it('rejects a question that is not part of the session', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds: questionIds.slice(0, 2) });
    await expect(
      submitAnswer({ sessionId: id, userId: alice, questionId: questionIds[5]!, selectedOptionIds: [] }),
    ).rejects.toThrow(/not part of this session/);
  });
});

describe('exam mode withholds feedback until submission', () => {
  it('returns no explanation while a non-revealing session is active', async () => {
    const id = await createSession({
      userId: alice, mode: 'mock_exam', questionIds: questionIds.slice(0, 3),
      revealAnswers: false, timeLimitSeconds: 3600,
    });

    const [graded] = await getQuestionsForGrading([questionIds[0]!]);
    const outcome = await submitAnswer({
      sessionId: id, userId: alice, questionId: questionIds[0]!,
      selectedOptionIds: [graded!.options.find((o) => o.isCorrect)!.id],
    });

    expect(outcome.feedback).toBeNull();

    // ...and the session view hides correctness too.
    const session = await getSession(id, alice);
    expect(session!.answers[questionIds[0]!]!.isCorrect).toBeNull();
    expect(session!.secondsRemaining).toBeGreaterThan(3500);
  });

  it('reveals everything once the exam is submitted', async () => {
    const id = await createSession({
      userId: alice, mode: 'mock_exam', questionIds: questionIds.slice(0, 2),
      revealAnswers: false, timeLimitSeconds: 3600,
    });
    const [graded] = await getQuestionsForGrading([questionIds[0]!]);
    await submitAnswer({
      sessionId: id, userId: alice, questionId: questionIds[0]!,
      selectedOptionIds: [graded!.options.find((o) => o.isCorrect)!.id],
    });
    await submitSession(id, alice);

    const review = await getSessionReview(id, alice);
    expect(review).not.toBeNull();
    expect(review!.items[0]!.isCorrect).toBe(true);
    expect(review!.items[0]!.question!.explanation).toBeTruthy();
  });
});

describe('one student cannot reach another student’s work', () => {
  it('returns null rather than another user’s session', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds });
    expect(await getSession(id, bob)).toBeNull();
  });

  it('refuses to record an answer against someone else’s session', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds });
    await expect(
      submitAnswer({ sessionId: id, userId: bob, questionId: questionIds[0]!, selectedOptionIds: [] }),
    ).rejects.toThrow(/not found/i);
  });

  it('refuses to submit someone else’s session', async () => {
    const id = await createSession({ userId: alice, mode: 'quick', questionIds });
    await expect(submitSession(id, bob)).rejects.toThrow(/not found/i);
  });

  it('keeps mistake books separate', async () => {
    const [graded] = await getQuestionsForGrading([questionIds[0]!]);
    const id = await createSession({ userId: bob, mode: 'quick', questionIds: [questionIds[0]!] });
    await submitAnswer({
      sessionId: id, userId: bob, questionId: questionIds[0]!,
      selectedOptionIds: [graded!.options.find((o) => !o.isCorrect)!.id],
    });

    const bobMistakes = await getMistakeBook(bob);
    expect(bobMistakes.length).toBeGreaterThan(0);
    // Alice answered this one correctly earlier; it must not appear for her.
    expect(bobMistakes.every((m) => m.questionId === questionIds[0]!)).toBe(true);
  });
});

describe('answering updates the learning state', () => {
  it('records mastery for the topic and its ancestors', async () => {
    const rows = await db
      .select({ nodeId: nodeMastery.syllabusNodeId, attempts: nodeMastery.attempts })
      .from(nodeMastery)
      .where(eq(nodeMastery.userId, alice));

    // A subtopic answer should have touched subtopic + topic + unit.
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((r) => r.attempts > 0)).toBe(true);
  });

  it('opens a Leitner state for every answered question', async () => {
    const states = await db
      .select()
      .from(questionStates)
      .where(eq(questionStates.userId, alice));

    expect(states.length).toBeGreaterThan(0);
    for (const s of states) {
      expect(s.attempts).toBeGreaterThan(0);
      expect(s.nextReviewAt).not.toBeNull();
      expect(s.box).toBeGreaterThanOrEqual(0);
      expect(s.box).toBeLessThanOrEqual(5);
    }
  });

  it('puts a wrongly-answered question into the mistake book', async () => {
    expect(await countMistakes(alice)).toBeGreaterThan(0);
    const book = await getMistakeBook(alice);
    for (const m of book) {
      expect(m.correctAttempts).toBeLessThan(m.attempts);
    }
  });

  it('records daily activity for the streak calculation', async () => {
    const [row] = await db
      .select()
      .from(dailyActivity)
      .where(eq(dailyActivity.userId, alice));

    expect(row).toBeDefined();
    expect(row!.answered).toBeGreaterThan(0);
  });

  it('reports overall answer counts and accuracy', async () => {
    const counts = await getAnswerCounts(alice);
    expect(counts.total).toBeGreaterThan(0);
    expect(counts.accuracy).toBeGreaterThanOrEqual(0);
    expect(counts.accuracy).toBeLessThanOrEqual(100);
  });
});

describe('bookmarks', () => {
  it('toggles on and off', async () => {
    const q = questionIds[0]!;
    expect(await toggleBookmark(alice, q)).toBe(true);
    expect((await getBookmarks(alice)).some((b) => b.questionId === q)).toBe(true);

    expect(await toggleBookmark(alice, q)).toBe(false);
    expect((await getBookmarks(alice)).some((b) => b.questionId === q)).toBe(false);
  });
});
