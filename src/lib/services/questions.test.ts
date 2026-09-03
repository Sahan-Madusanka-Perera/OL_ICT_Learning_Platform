import { describe, it, expect, beforeAll } from 'vitest';
import { eq, and, sql, inArray } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { questions, questionOptions } from '@/lib/db/schema';
import {
  getQuestionsForStudent,
  getQuestionsForGrading,
  selectQuestions,
  countPublishedQuestions,
} from './questions';

/**
 * The answer-safety boundary.
 *
 * These tests exist so the guarantee survives refactoring: if someone later
 * adds `is_correct` to the student query "just for the review screen", this
 * file fails.
 */

let publishedIds: string[] = [];

beforeAll(async () => {
  publishedIds = await selectQuestions({ limit: 10 });
  expect(
    publishedIds.length,
    'seed the database first: npm run db:migrate && npm run db:seed',
  ).toBeGreaterThan(0);
});

/** Walk an arbitrary object graph looking for anything answer-shaped. */
function findForbiddenKeys(value: unknown, path = '$'): string[] {
  const FORBIDDEN = /^(is_?correct|correct|misconception|answer_?key|correctOptionIds?)$/i;
  const found: string[] = [];

  const walk = (node: unknown, at: string) => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${at}[${i}]`));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (FORBIDDEN.test(key)) found.push(`${at}.${key}`);
      walk(child, `${at}.${key}`);
    }
  };

  walk(value, path);
  return found;
}

describe('student question payloads carry no answer', () => {
  it('returns no correctness field anywhere in the object graph', async () => {
    const result = await getQuestionsForStudent(publishedIds);
    expect(result.length).toBeGreaterThan(0);

    const leaks = findForbiddenKeys(result);
    expect(leaks, `answer key leaked at: ${leaks.join(', ')}`).toEqual([]);
  });

  it('survives JSON serialisation without leaking', async () => {
    // This is what actually crosses the wire to the browser.
    const wire = JSON.parse(JSON.stringify(await getQuestionsForStudent(publishedIds)));
    expect(findForbiddenKeys(wire)).toEqual([]);
  });

  it('still returns everything a student legitimately needs', async () => {
    const [q] = await getQuestionsForStudent(publishedIds.slice(0, 1));
    expect(q).toBeDefined();
    expect(q!.stem.length).toBeGreaterThan(0);
    expect(q!.options.length).toBeGreaterThanOrEqual(2);
    expect(q!.topic.title.length).toBeGreaterThan(0);
    expect(q!.source.type).toBeDefined();
    for (const o of q!.options) {
      expect(o.id).toBeTruthy();
      expect(o.content ?? o.imageUrl).toBeTruthy();
    }
  });

  it('preserves the caller’s question order, so a served session is stable', async () => {
    const ordered = [...publishedIds].reverse();
    const result = await getQuestionsForStudent(ordered);
    expect(result.map((q) => q.id)).toEqual(ordered);
  });

  it('returns an empty array for no input rather than fetching everything', async () => {
    expect(await getQuestionsForStudent([])).toEqual([]);
  });
});

describe('the grading payload does carry the answer', () => {
  it('exposes exactly one correct option per single-answer question', async () => {
    const graded = await getQuestionsForGrading(publishedIds);
    for (const q of graded) {
      if (q.type !== 'mcq_single') continue;
      const correct = q.options.filter((o) => o.isCorrect);
      expect(correct, `${q.publicId} should have exactly one correct option`).toHaveLength(1);
    }
  });

  it('carries an explanation for every published question', async () => {
    const graded = await getQuestionsForGrading(publishedIds);
    for (const q of graded) {
      expect(q.explanation, `${q.publicId} has no explanation`).toBeTruthy();
    }
  });

  it('carries a misconception for the wrong options', async () => {
    const graded = await getQuestionsForGrading(publishedIds);
    const distractors = graded.flatMap((q) => q.options.filter((o) => !o.isCorrect));
    const withReason = distractors.filter((o) => o.misconception);
    // Seeded model questions all have them; this guards against regression.
    expect(withReason.length / distractors.length).toBeGreaterThan(0.9);
  });
});

describe('question selection', () => {
  it('only ever serves published questions', async () => {
    const ids = await selectQuestions({ limit: 50 });
    const rows = await db
      .select({ status: questions.status, confidence: questions.answerConfidence })
      .from(questions)
      .where(inArray(questions.id, ids));

    expect(rows.length).toBe(ids.length);
    for (const r of rows) {
      expect(r.status).toBe('published');
      expect(r.confidence).not.toBe('unverified');
    }
  });

  it('never serves the unverified past-paper drafts', async () => {
    const draftIds = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.answerConfidence, 'unverified'));

    expect(draftIds.length, 'expected seeded unverified drafts').toBeGreaterThan(0);

    const served = await selectQuestions({ limit: 500 });
    for (const d of draftIds) {
      expect(served).not.toContain(d.id);
    }
  });

  it('respects a difficulty filter', async () => {
    const ids = await selectQuestions({ limit: 20, difficulty: ['easy'] });
    if (ids.length === 0) return;
    const rows = await db
      .select({ difficulty: questions.difficulty })
      .from(questions)
      .where(inArray(questions.id, ids));
    for (const r of rows) expect(r.difficulty).toBe('easy');
  });

  it('restricts to a syllabus subtree by path prefix', async () => {
    // Unit 3 — data representation.
    const ids = await selectQuestions({ limit: 20, pathPrefix: '03' });
    expect(ids.length).toBeGreaterThan(0);
    const scoped = await getQuestionsForStudent(ids);
    for (const q of scoped) {
      expect(q.topic.code.startsWith('3.')).toBe(true);
    }
  });

  it('honours the exclude list', async () => {
    const first = await selectQuestions({ limit: 5 });
    const second = await selectQuestions({ limit: 20, excludeIds: first });
    for (const id of first) expect(second).not.toContain(id);
  });

  it('counts published questions, optionally within a subtree', async () => {
    const all = await countPublishedQuestions();
    const unit3 = await countPublishedQuestions('03');
    expect(all).toBeGreaterThan(0);
    expect(unit3).toBeGreaterThan(0);
    expect(unit3).toBeLessThanOrEqual(all);
  });
});
