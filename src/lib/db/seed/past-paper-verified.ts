/**
 * Past-paper questions transcribed from a text layer rather than recovered by
 * OCR — and checked, question by question, against the official marking scheme.
 *
 * WHY THIS IS A DIFFERENT CLAIM FROM ./past-paper-questions.ts
 * ------------------------------------------------------------
 * That file is honest about being OCR: "the question text here is OCR output
 * that has been parsed, not text a human has read against the paper." Its
 * grades exist because OCR damages exactly what O/L ICT leans on — subscripts,
 * superscripts, circuit diagrams, worksheet segments.
 *
 * None of that applies to the born-digital papers. `tools/extract-past-papers/
 * borndigital.py` reads the characters the Department typeset, restores the
 * sub- and superscripts from font size and baseline, and sorts every line into
 * true reading order. The result is not a better guess at the paper; for the
 * text, it *is* the paper.
 *
 * WHAT IS STILL NOT CLAIMED
 * -------------------------
 * Nothing here is published. Two-approver review remains the gate, and it
 * should: an exact transcription can still be attached to the wrong syllabus
 * topic, and a figure can still be missing. What has changed is which of the
 * reviewer's jobs is already done — they no longer have to compare the text
 * against the PDF character by character, only to confirm the judgement calls.
 *
 * WHAT WAS ACTUALLY FOUND
 * -----------------------
 * Doing this for 2025 surfaced three classes of error in the OCR version:
 *
 *   - Every subscript was gone. `1110 1110₂` had become `1110 11102` and
 *     `65₁₀` had become `6510`, which silently changes what is being asked.
 *   - Reading order was wrong in three places. Question 10's A/B/C list had
 *     attached itself to question 14, question 18's fourth option had swallowed
 *     the opening line of question 19's stimulus, and question 38's options
 *     arrived as 3, 4, 1, 2 because two of them are typeset one point higher.
 *   - 22 of the 40 topic assignments were wrong, 11 of them sitting in the
 *     keyword classifier's fallback bucket.
 *
 * Questions 11, 12 and 13 have no text in their options at all — they are icon
 * questions — and their twelve option images are in ./past-paper-option-icons.
 */

import raw from './data/past-paper-borndigital.json';

export type VerifiedTranscription = 'text_layer' | 'missing';

export type VerifiedQuestion = {
  year: number;
  questionNumber: number;
  /** Hand-assigned against the syllabus, not keyword-classified. */
  topic: string;
  stem: string;
  /** Null when the four options are pictures — see `imageOptions`. */
  options: string[] | null;
  /** True when every option is an icon and carries no text. */
  imageOptions: boolean;
  /** The shared intro these questions hang off, where the paper has one. */
  stimulus: string | null;
  transcription: VerifiedTranscription;
};

type RawRow = {
  year: number;
  q: number;
  topic?: string;
  stem: string | null;
  options: string[] | null;
  imageOptions: boolean;
  stimulus: string | null;
  transcription: string;
};

/**
 * Only years that have actually been read against their marking scheme appear
 * here. The extractor handles all six born-digital papers, but running a script
 * is not the same as checking the result, and this file is the stronger claim.
 */
export const VERIFIED_YEARS = [2025] as const;

export const VERIFIED_QUESTIONS: readonly VerifiedQuestion[] = (raw as RawRow[])
  .filter(
    (r): r is RawRow & { topic: string; stem: string } =>
      (VERIFIED_YEARS as readonly number[]).includes(r.year) &&
      r.stem !== null &&
      typeof r.topic === 'string',
  )
  .map((r) => ({
    year: r.year,
    questionNumber: r.q,
    topic: r.topic,
    stem: r.stem,
    options: r.options,
    imageOptions: r.imageOptions,
    stimulus: r.stimulus,
    transcription: r.transcription as VerifiedTranscription,
  }));

export function isVerified(year: number): boolean {
  return (VERIFIED_YEARS as readonly number[]).includes(year);
}

export const VERIFIED_STATS = {
  total: VERIFIED_QUESTIONS.length,
  years: [...VERIFIED_YEARS],
  withTextOptions: VERIFIED_QUESTIONS.filter((q) => q.options !== null).length,
  withImageOptions: VERIFIED_QUESTIONS.filter((q) => q.imageOptions).length,
  withStimulus: VERIFIED_QUESTIONS.filter((q) => q.stimulus !== null).length,
  topics: new Set(VERIFIED_QUESTIONS.map((q) => q.topic)).size,
} as const;
