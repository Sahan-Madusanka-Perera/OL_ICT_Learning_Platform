import 'server-only';

import { and, eq, isNull, inArray, notInArray, sql, desc, asc, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  questions,
  questionOptions,
  syllabusNodes,
  examPapers,
  assets,
  stimuli,
} from '@/lib/db/schema';

/**
 * Question retrieval.
 *
 * The central rule of this file: there are two ways to read a question, and
 * they are different functions with different return types.
 *
 *   getQuestionsForStudent()  — never selects is_correct or misconception
 *   getQuestionsForGrading()  — server-only, used by the grader and review UI
 *
 * `StudentQuestion` has no field in which a correct answer could travel, so
 * a component cannot leak one even by accident. A test in
 * services/questions.test.ts asserts this at runtime as well.
 */

export type StudentOption = {
  id: string;
  label: string;
  content: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type StudentQuestion = {
  id: string;
  publicId: string;
  type: 'mcq_single' | 'mcq_multi' | 'true_false';
  stem: string;
  marks: number;
  estimatedSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options: StudentOption[];
  /** Shared context, e.g. a spreadsheet segment used by several questions. */
  stimulus: {
    kind: string;
    content: string | null;
    imageUrl: string | null;
    /** The asset's own description. A caption is not a substitute — see below. */
    imageAlt: string | null;
    caption: string | null;
  } | null;
  /** Provenance — drives the PAST PAPER / MODEL QUESTION badge. */
  source: {
    type: 'past_paper' | 'model' | 'textbook_adapted';
    paper: { year: number; sitting: string; paperNo: number } | null;
    questionNumber: number | null;
  };
  topic: { id: string; code: string; title: string };
};

/** An option including the answer key. Server-side only. */
export type GradableOption = StudentOption & {
  isCorrect: boolean;
  misconception: string | null;
};

/**
 * The extra fields that only ever exist on the server.
 *
 * Note `Omit<StudentQuestion, 'options'>` rather than a plain intersection:
 * intersecting two array-typed properties keeps the narrower element type,
 * which would silently hide `isCorrect` from callers.
 */
export type GradableQuestion = Omit<StudentQuestion, 'options'> & {
  explanation: string | null;
  examTip: string | null;
  answerConfidence: 'official_key' | 'expert_verified' | 'unverified';
  options: GradableOption[];
};

const PUBLISHED = and(eq(questions.status, 'published'), isNull(questions.deletedAt));

/* ------------------------------------------------------------------ *
 * Student-facing reads
 * ------------------------------------------------------------------ */

export async function getQuestionsForStudent(
  questionIds: string[],
): Promise<StudentQuestion[]> {
  if (questionIds.length === 0) return [];

  const rows = await db
    .select({
      id: questions.id,
      publicId: questions.publicId,
      type: questions.type,
      stem: questions.stemMd,
      marks: questions.marks,
      estimatedSeconds: questions.estimatedSeconds,
      difficulty: questions.difficulty,
      sourceType: questions.sourceType,
      questionNumber: questions.questionNumber,
      nodeId: syllabusNodes.id,
      nodeCode: syllabusNodes.code,
      nodeTitle: syllabusNodes.title,
      paperYear: examPapers.year,
      paperSitting: examPapers.sitting,
      paperNo: examPapers.paperNo,
      stimulusKind: stimuli.kind,
      stimulusContent: stimuli.contentMd,
      stimulusCaption: stimuli.caption,
      stimulusAssetPath: assets.storagePath,
      stimulusAssetAlt: assets.altText,
    })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .leftJoin(examPapers, eq(examPapers.id, questions.paperId))
    .leftJoin(stimuli, eq(stimuli.id, questions.stimulusId))
    .leftJoin(assets, eq(assets.id, stimuli.assetId))
    .where(inArray(questions.id, questionIds));

  const options = await getStudentOptions(questionIds);

  const byId = new Map(rows.map((r) => [r.id, r]));

  // Preserve the caller's order — the session's served order matters.
  return questionIds
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => r !== undefined)
    .map((r) => ({
      id: r.id,
      publicId: r.publicId,
      type: r.type as StudentQuestion['type'],
      stem: r.stem,
      marks: r.marks,
      estimatedSeconds: r.estimatedSeconds,
      difficulty: r.difficulty,
      options: options.get(r.id) ?? [],
      stimulus: r.stimulusKind
        ? {
            kind: r.stimulusKind,
            content: r.stimulusContent,
            imageUrl: r.stimulusAssetPath,
            imageAlt: r.stimulusAssetAlt,
            caption: r.stimulusCaption,
          }
        : null,
      source: {
        type: r.sourceType,
        paper:
          r.paperYear !== null && r.paperSitting !== null && r.paperNo !== null
            ? { year: r.paperYear, sitting: r.paperSitting, paperNo: r.paperNo }
            : null,
        questionNumber: r.questionNumber,
      },
      topic: { id: r.nodeId, code: r.nodeCode, title: r.nodeTitle },
    }));
}

/** Explicit column list. `isCorrect` is not in it, and must never be. */
async function getStudentOptions(questionIds: string[]) {
  const rows = await db
    .select({
      id: questionOptions.id,
      questionId: questionOptions.questionId,
      label: questionOptions.label,
      content: questionOptions.contentMd,
      sortOrder: questionOptions.sortOrder,
      imageUrl: assets.storagePath,
      imageAlt: assets.altText,
    })
    .from(questionOptions)
    .leftJoin(assets, eq(assets.id, questionOptions.assetId))
    .where(inArray(questionOptions.questionId, questionIds))
    .orderBy(asc(questionOptions.sortOrder));

  const map = new Map<string, StudentOption[]>();
  for (const r of rows) {
    const list = map.get(r.questionId) ?? [];
    list.push({
      id: r.id,
      label: r.label,
      content: r.content,
      imageUrl: r.imageUrl,
      imageAlt: r.imageAlt,
    });
    map.set(r.questionId, list);
  }
  return map;
}

/* ------------------------------------------------------------------ *
 * Server-only reads (grading, review, post-submission explanations)
 * ------------------------------------------------------------------ */

/**
 * Full question including the answer key.
 *
 * Only three callers are legitimate: the grader, the admin review UI, and
 * the post-submission review screen (where the student has already answered
 * and is entitled to see the explanation).
 */
export async function getQuestionsForGrading(
  questionIds: string[],
): Promise<GradableQuestion[]> {
  if (questionIds.length === 0) return [];

  const base = await getQuestionsForStudent(questionIds);

  const extras = await db
    .select({
      id: questions.id,
      explanation: questions.explanationMd,
      examTip: questions.examTipMd,
      answerConfidence: questions.answerConfidence,
    })
    .from(questions)
    .where(inArray(questions.id, questionIds));

  const answerRows = await db
    .select({
      id: questionOptions.id,
      questionId: questionOptions.questionId,
      isCorrect: questionOptions.isCorrect,
      misconception: questionOptions.misconceptionMd,
    })
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds));

  const extraById = new Map(extras.map((e) => [e.id, e]));
  const answerByOption = new Map(answerRows.map((a) => [a.id, a]));

  return base.map((q) => {
    const extra = extraById.get(q.id);
    return {
      ...q,
      explanation: extra?.explanation ?? null,
      examTip: extra?.examTip ?? null,
      answerConfidence: extra?.answerConfidence ?? 'unverified',
      options: q.options.map((o) => ({
        ...o,
        isCorrect: answerByOption.get(o.id)?.isCorrect ?? false,
        misconception: answerByOption.get(o.id)?.misconception ?? null,
      })),
    };
  });
}

/* ------------------------------------------------------------------ *
 * Selection — how questions get chosen for a session
 * ------------------------------------------------------------------ */

export type SelectionCriteria = {
  /** Restrict to a syllabus subtree, by materialised path prefix. */
  pathPrefix?: string;
  difficulty?: ('easy' | 'medium' | 'hard')[];
  sourceType?: ('past_paper' | 'model' | 'textbook_adapted')[];
  paperId?: string;
  /** Questions this student has already seen, to avoid immediate repeats. */
  excludeIds?: string[];
  limit: number;
  /** Deterministic ordering for tests; random in production. */
  seed?: number;
};

/**
 * Pick published questions matching the criteria.
 *
 * Note the ORDER BY random(): fine at this scale, and it keeps successive
 * practice sets from repeating. If the bank grows past ~100k rows this
 * becomes a sampling query instead, which is a localised change.
 */
export async function selectQuestions(criteria: SelectionCriteria): Promise<string[]> {
  const conditions = [PUBLISHED];

  if (criteria.pathPrefix) {
    conditions.push(sql`${syllabusNodes.path} LIKE ${criteria.pathPrefix + '%'}`);
  }
  if (criteria.difficulty?.length) {
    conditions.push(inArray(questions.difficulty, criteria.difficulty));
  }
  if (criteria.sourceType?.length) {
    conditions.push(inArray(questions.sourceType, criteria.sourceType));
  }
  if (criteria.paperId) {
    conditions.push(eq(questions.paperId, criteria.paperId));
  }
  if (criteria.excludeIds?.length) {
    conditions.push(notInArray(questions.id, criteria.excludeIds));
  }

  const rows = await db
    .select({ id: questions.id })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(and(...conditions))
    .orderBy(
      criteria.paperId ? asc(questions.questionNumber) : sql`random()`,
    )
    .limit(criteria.limit);

  return rows.map((r) => r.id);
}

export async function countPublishedQuestions(pathPrefix?: string): Promise<number> {
  const conditions = [PUBLISHED];
  if (pathPrefix) conditions.push(sql`${syllabusNodes.path} LIKE ${pathPrefix + '%'}`);

  const [row] = await db
    .select({ n: count() })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(and(...conditions));

  return row?.n ?? 0;
}
