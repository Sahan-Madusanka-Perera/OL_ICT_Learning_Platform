/**
 * Every Paper I MCQ we could extract from the past papers in `pastpapers/`,
 * joined to its official answer where a marking scheme supplies one.
 *
 * WHAT THIS IS, AND WHAT IT IS NOT
 * --------------------------------
 * The question text here is OCR output that has been parsed, not text a human
 * has read against the paper. It is good — the papers scan cleanly and the
 * parser is conservative — but it is not proof-read, and O/L ICT is a subject
 * whose questions lean hard on exactly the things OCR destroys: binary and hex
 * subscripts, powers of two, logic circuits, spreadsheet segments, flowcharts.
 *
 * So every row carries an honest `extraction` grade, and NOTHING here is
 * seeded as published. The grades are assigned by `tools/extract-past-papers`,
 * deliberately pessimistically:
 *
 *   clean         Four options recovered, no damage signal detected. Ready for
 *                 a reviewer to read once and approve.
 *   needs_asset   The question refers to a figure, table, circuit or worksheet
 *                 that is not yet captured as an `assets` row — or its options
 *                 are only distinguishable when that figure is present. The
 *                 text alone cannot be answered.
 *   needs_repair  Recovered, but a damage signal fired: a lost subscript or
 *                 exponent, non-ASCII speckle, or an implausibly short field.
 *                 A human must compare it against the PDF.
 *   incomplete    The four options could not be recovered at all.
 *
 * `clean` is a claim about extraction only. It is never a claim that the
 * question is correct, well-topiced, or fit to serve.
 *
 * ANSWERS
 * -------
 * Answers come from `./answer-keys.ts` — the Department of Examinations
 * marking schemes — and cover 8 of the 15 years. A question with an official
 * single answer gets `answer_confidence: 'official_key'`; everything else
 * stays `unverified` and therefore unpublishable by database constraint.
 *
 * Holding an official key does not make a question servable: the key answers
 * the paper, and we still have to be sure our transcription *is* the paper.
 * That is what the review queue is for.
 */

import raw from './data/past-paper-mcqs.json';
import {
  officialAnswer,
  isSingleAnswer,
  correctIndex,
  type OfficialAnswer,
} from './answer-keys';

/** How much of the question survived extraction. See the note above. */
export type ExtractionGrade = 'clean' | 'needs_asset' | 'needs_repair' | 'incomplete';

type RawRow = {
  year: number;
  q: number;
  topic: string;
  extraction: string;
  stem: string;
  options: string[] | null;
};

export type PastPaperQuestionSeed = {
  year: number;
  questionNumber: number;
  /** Best-guess syllabus topic for triage. The reviewer confirms or corrects it. */
  topic: string;
  stem: string;
  /** Null when the options could not be recovered (`extraction: 'incomplete'`). */
  options: string[] | null;
  extraction: ExtractionGrade;
  /** As printed in the marking scheme; null for a year we have no scheme for. */
  officialAnswer: OfficialAnswer | null;
  /** 0-based correct option, or null when voided/multi-accept/unkeyed. */
  correctIndex: 0 | 1 | 2 | 3 | null;
};

export const PAST_PAPER_QUESTIONS: readonly PastPaperQuestionSeed[] = (raw as RawRow[]).map(
  (r) => {
    const answer = officialAnswer(r.year, r.q);
    return {
      year: r.year,
      questionNumber: r.q,
      topic: r.topic,
      stem: r.stem,
      options: r.options && r.options.length === 4 ? r.options : null,
      extraction: r.extraction as ExtractionGrade,
      officialAnswer: answer,
      correctIndex: answer ? correctIndex(answer) : null,
    };
  },
);

/**
 * A question we can attach an official single answer to.
 *
 * Still not publishable on its own — the stem has to be read by a human
 * first — but this is the queue a reviewer should work through first,
 * because approving one of these needs no answer research.
 */
export function isReviewReady(q: PastPaperQuestionSeed): boolean {
  return q.extraction === 'clean' && q.options !== null && q.correctIndex !== null;
}

export const PAST_PAPER_QUESTION_STATS = {
  total: PAST_PAPER_QUESTIONS.length,
  byExtraction: {
    clean: PAST_PAPER_QUESTIONS.filter((q) => q.extraction === 'clean').length,
    needsAsset: PAST_PAPER_QUESTIONS.filter((q) => q.extraction === 'needs_asset').length,
    needsRepair: PAST_PAPER_QUESTIONS.filter((q) => q.extraction === 'needs_repair').length,
    incomplete: PAST_PAPER_QUESTIONS.filter((q) => q.extraction === 'incomplete').length,
  },
  withOfficialAnswer: PAST_PAPER_QUESTIONS.filter((q) => q.officialAnswer !== null).length,
  withSingleOfficialAnswer: PAST_PAPER_QUESTIONS.filter(
    (q) => q.officialAnswer !== null && isSingleAnswer(q.officialAnswer),
  ).length,
  reviewReady: PAST_PAPER_QUESTIONS.filter(isReviewReady).length,
} as const;
