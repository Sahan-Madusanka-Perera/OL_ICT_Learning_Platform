/**
 * Past-paper questions transcribed from a text layer rather than recovered by
 * OCR.
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
 * TWO TIERS, BECAUSE RUNNING A SCRIPT IS NOT CHECKING THE RESULT
 * --------------------------------------------------------------
 * All six born-digital papers (2020-2025) now go through that extractor, and
 * all six give up 40 of 40 questions with their options. But they do not all
 * carry the same claim, and collapsing them into one would overstate five of
 * them:
 *
 *   'text_layer'  The characters are the Department's. Nobody has read the
 *                 result against the marking scheme, and the syllabus topic is
 *                 a keyword guess. 2020-2024.
 *
 *   'verified'    The above, plus: read question by question against the
 *                 official marking scheme, with every topic assigned by hand.
 *                 2025.
 *
 * The gap between them is not theoretical. Checking 2025 by hand found 22 of
 * its 40 keyword topics wrong, 11 of those sitting in the classifier's fallback
 * bucket — so a `text_layer` row's topic should be read as triage, which is
 * what `topicSource` records. Promoting a year is a person's job: check it
 * against the scheme, assign its topics, then move it into VERIFIED_YEARS.
 *
 * WHAT IS STILL NOT CLAIMED, FOR EITHER TIER
 * -------------------------------------------
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
 * Extending it to 2020-2024 surfaced a fourth, in the papers themselves rather
 * than in the extraction: the 2020 paper prints question 4's third option as
 * `(2)`, and the 2021 paper prints question 8's third as `(5)`. Both are the
 * Department's own typo, both are plainly visible in the PDF, and both used to
 * make a strict 1,2,3,4 scan discard an otherwise perfect question. They are
 * now transcribed in printed order and carry a `sourceDefect` note, so the
 * reviewer is told what the paper did instead of being shown a silent repair.
 *
 * Questions whose options are pictures and nothing else — 2022 Q13 and Q39,
 * 2023 Q13 and Q15, 2024 Q11, 2025 Q11-13 — have no text in their options at
 * all, and their option images are in ./past-paper-option-icons.
 */

import raw from './data/past-paper-borndigital.json';

export type Transcription = 'text_layer' | 'missing';

/** How far a year has been taken. See the two-tier note above. */
export type TranscriptionTier = 'text_layer' | 'verified';

/** Whether a syllabus topic was chosen by a person or by the keyword table. */
export type TopicSource = 'hand' | 'keyword';

export type TranscribedQuestion = {
  year: number;
  questionNumber: number;
  topic: string;
  /** 'hand' only where someone assigned it against the syllabus themselves. */
  topicSource: TopicSource;
  tier: TranscriptionTier;
  stem: string;
  /** Null when the four options are pictures — see `imageOptions`. */
  options: string[] | null;
  /** True when every option is an icon and carries no text. */
  imageOptions: boolean;
  /** The shared intro these questions hang off, where the paper has one. */
  stimulus: string | null;
  /** Set where the *paper* is wrong — a misnumbered option marker. */
  sourceDefect: string | null;
  transcription: Transcription;
};

type RawRow = {
  year: number;
  q: number;
  topic?: string;
  topicSource?: string;
  stem: string | null;
  options: string[] | null;
  imageOptions: boolean;
  stimulus: string | null;
  sourceDefect?: string | null;
  transcription: string;
};

/**
 * Read off the text layer AND checked against the official marking scheme,
 * with topics assigned by hand.
 */
export const VERIFIED_YEARS = [2025] as const;

/**
 * Read off the text layer, topics assigned by keyword, not yet checked against
 * a marking scheme. The text is exact; the topic is triage.
 */
export const TEXT_LAYER_YEARS = [2020, 2021, 2022, 2023, 2024] as const;

const TRANSCRIBED_YEARS: readonly number[] = [...VERIFIED_YEARS, ...TEXT_LAYER_YEARS];

export const TRANSCRIBED_QUESTIONS: readonly TranscribedQuestion[] = (raw as RawRow[])
  .filter(
    (r): r is RawRow & { topic: string; stem: string } =>
      TRANSCRIBED_YEARS.includes(r.year) && r.stem !== null && typeof r.topic === 'string',
  )
  .map((r) => ({
    year: r.year,
    questionNumber: r.q,
    topic: r.topic,
    topicSource: (r.topicSource === 'hand' ? 'hand' : 'keyword') as TopicSource,
    tier: ((VERIFIED_YEARS as readonly number[]).includes(r.year)
      ? 'verified'
      : 'text_layer') as TranscriptionTier,
    stem: r.stem,
    options: r.options,
    imageOptions: r.imageOptions,
    stimulus: r.stimulus,
    sourceDefect: r.sourceDefect ?? null,
    transcription: r.transcription as Transcription,
  }))
  .sort((a, b) => a.year - b.year || a.questionNumber - b.questionNumber);

/** Kept for callers that only care about the stronger claim. */
export const VERIFIED_QUESTIONS: readonly TranscribedQuestion[] = TRANSCRIBED_QUESTIONS.filter(
  (q) => q.tier === 'verified',
);

export function isVerified(year: number): boolean {
  return (VERIFIED_YEARS as readonly number[]).includes(year);
}

export function isTranscribed(year: number): boolean {
  return TRANSCRIBED_YEARS.includes(year);
}

export const TRANSCRIBED_STATS = {
  total: TRANSCRIBED_QUESTIONS.length,
  years: [...TEXT_LAYER_YEARS, ...VERIFIED_YEARS].sort((a, b) => a - b),
  verified: VERIFIED_QUESTIONS.length,
  verifiedYears: [...VERIFIED_YEARS],
  textLayerOnly: TRANSCRIBED_QUESTIONS.filter((q) => q.tier === 'text_layer').length,
  textLayerYears: [...TEXT_LAYER_YEARS],
  withTextOptions: TRANSCRIBED_QUESTIONS.filter((q) => q.options !== null).length,
  withImageOptions: TRANSCRIBED_QUESTIONS.filter((q) => q.imageOptions).length,
  withStimulus: TRANSCRIBED_QUESTIONS.filter((q) => q.stimulus !== null).length,
  withSourceDefect: TRANSCRIBED_QUESTIONS.filter((q) => q.sourceDefect !== null).length,
  handAssignedTopics: TRANSCRIBED_QUESTIONS.filter((q) => q.topicSource === 'hand').length,
  topics: new Set(TRANSCRIBED_QUESTIONS.map((q) => q.topic)).size,
} as const;

/** The old name, kept so existing callers and tests keep compiling. */
export const VERIFIED_STATS = {
  total: VERIFIED_QUESTIONS.length,
  years: [...VERIFIED_YEARS],
  withTextOptions: VERIFIED_QUESTIONS.filter((q) => q.options !== null).length,
  withImageOptions: VERIFIED_QUESTIONS.filter((q) => q.imageOptions).length,
  withStimulus: VERIFIED_QUESTIONS.filter((q) => q.stimulus !== null).length,
  topics: new Set(VERIFIED_QUESTIONS.map((q) => q.topic)).size,
} as const;
