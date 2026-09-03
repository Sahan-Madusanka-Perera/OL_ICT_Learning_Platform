/**
 * Official Paper I answer keys, read from the Department of Examinations
 * marking schemes in `pastpapers/Marking Scheme/`.
 *
 * These are the reason `answer_confidence` has an `official_key` level at all.
 * Until these documents were supplied, every past-paper question in this
 * repository was necessarily `unverified` and therefore unpublishable.
 *
 * HOW THESE WERE READ
 * -------------------
 * Every marking scheme stores its Paper I key as a *scanned image* of a
 * four-column grid, not as text. OCR on that grid is not trustworthy — the
 * digits sit on dotted leader lines and tesseract routinely drops or
 * transposes them. So each grid was rendered at 400–600 dpi and read
 * visually, then spot-checked against questions whose answers can be derived
 * independently (number-base conversions, pseudocode traces, logic circuits).
 * Every such check agreed with the key.
 *
 * Re-run `tools/extract-past-papers/README.md` if a grid needs re-reading.
 *
 * VOIDED AND MULTI-ACCEPT QUESTIONS
 * ---------------------------------
 * The Department sometimes accepts more than one option for a defective
 * question. Those are recorded here exactly as printed rather than being
 * flattened to a single answer:
 *
 *   'all'    every option was accepted — the question was effectively voided
 *   '1,2,3'  only the listed options were accepted
 *
 * A question with a non-single key has no single correct option, so it must
 * never be served as a scored single-answer MCQ. `isSingleAnswer()` is the
 * guard; the seeder uses it to leave those questions as drafts.
 */

/** As printed in the marking scheme: '1'..'4', 'all', or a list like '3,4'. */
export type OfficialAnswer = '1' | '2' | '3' | '4' | 'all' | string;

export type AnswerKeySource = {
  /** Exam year, matching `PaperSeed.year`. */
  year: number;
  /** The marking scheme PDF this key was read from. */
  sourceFile: string;
  /** Which page of that PDF carries the Paper I grid (1-based). */
  page: number;
  /** 40 answers, question 1 first. */
  answers: readonly OfficialAnswer[];
  notes?: string;
};

export const OFFICIAL_ANSWER_KEYS: readonly AnswerKeySource[] = [
  {
    year: 2012,
    sourceFile: 'pastpapers/Marking Scheme/2012 OL ICT Marking Scheme English @ apepanthiya.lk.pdf',
    page: 2,
    answers: [
      '4', '2', '1', '4', '3', '4', '4', '2', '2', '3',
      '3', '1', '2', '3', '1', '1,2,3', '3', '1', '3', '2',
      '3', '2', '4', '4', '4', '3', '4', '1', '1', '3',
      '1', '1', '3', '3', '2', '2', '2', '3', '4', '4',
    ],
    notes: 'Q16 accepted options 1, 2 and 3.',
  },
  {
    year: 2014,
    sourceFile: 'pastpapers/Marking Scheme/2014 OL ICT Marking Scheme EM.pdf',
    page: 2,
    answers: [
      '1', '2', '1', '2', '2', '3', '3', '1', '2', '3',
      '2', '2', '4', '4', '3', '4', '1', '3', '3', '3',
      '3', '1', '2', '4', '1', '4', '2', '3', '1', '3',
      '2', '3', '4', '4', '4', '3', '4', '1', '2', '4',
    ],
  },
  {
    year: 2017,
    sourceFile: 'pastpapers/Marking Scheme/2017 OL  ICT Marking Scheme English Medium .pdf',
    page: 3,
    answers: [
      '1', '4', '2', '4', '2', '3', '2', '1', '1', '2',
      '3', '2', '3', '4', '3', '1', '3', '4', '1', '1',
      '2', '2', '4', '3', '3', '4', 'all', '1', '4', '1',
      '1', '1', '2', '3', '2', '3', '3,4', '3', '1', '3',
    ],
    notes:
      'This scheme is marked "Amended". Q27 was voided (all options accepted); ' +
      'Q37 accepted options 3 and 4.',
  },
  {
    year: 2018,
    sourceFile: 'pastpapers/Marking Scheme/2018 OL ICT Marking Scheme English Medium .PDF',
    page: 4,
    answers: [
      '1', '2', '1', '4', '2', '2', '4', '2', '1', '4',
      '1', '2', '1', '3', '3', '1', '2', '4', '2', '1',
      '2', '1', '4', '2', '1', '3', '1', '3', '3', '1',
      '3', '1', '2', '2', '3', '3', 'all', '2', '3', '4',
    ],
    notes: 'Q37 was voided (all options accepted).',
  },
  {
    year: 2019,
    sourceFile: 'pastpapers/Marking Scheme/2019 OL ICT Marking Scheme English Medium.pdf',
    page: 11,
    answers: [
      '3', '3', '4', '2', '1', '3', '2', '3', '3', '3',
      '2', '4', '1', '1', '4', '3', '1', '1', '3', '1',
      '3', '1', '2', '4', '4', '4', '3', '1', '4', '2',
      '1', '2', '2', '2', '4', '4', '4', '1', '4', '2',
    ],
  },
  {
    year: 2020,
    sourceFile:
      'pastpapers/Marking Scheme/2020-OL-Information-And-Communication-Technology-Marking-Scheme-English-Medium.pdf',
    page: 11,
    answers: [
      '4', '1', '1', '2', '1', '3', '2', '1', '3', '4',
      '3', '2', '2', '4', '3', '2', '3', '4', '3', '3',
      '4', '4', '4', '1', '4', '1', '2', '3', '3', '2',
      '3', '1', '2', '1', '1', '1', '1', '2', '1', '1',
    ],
  },
  {
    year: 2021,
    sourceFile: 'pastpapers/Marking Scheme/2021 ICT English Medium Marking Scheme.pdf',
    page: 12,
    answers: [
      '4', '3', '3', '2', '4', '2', '3', '1', '2', '1',
      '3', '3', '1', '1', '2', '4', '4', '4', '3', '2',
      '4', '1', '1', '2', '4', '3', '1', '2', '2', '1',
      '4', '2', '4', '2', '1', '2', '3', '2', '1', '2',
    ],
  },
  {
    year: 2022,
    sourceFile: 'pastpapers/Marking Scheme/20222023-OL-ICT-Marking-Scheme-English-Medium.pdf',
    page: 1,
    answers: [
      '1', '4', '4', '2', '3', '4', '2', '1', '4', '3',
      '4', '4', '2', '3', '1', '2', '1', '1', '3', '4',
      '4', '3', '1', '3', '3', '3', '4', '2', '4', 'all',
      '2', '3', '4', '2', '4', '2', '1', '4', '3', '3',
    ],
    notes:
      'This PDF holds ONLY the Paper I key — its second page states the ' +
      'supplier does not have the Paper II scheme. Q30 was voided.',
  },
  {
    year: 2023,
    sourceFile: 'pastpapers/Marking Scheme/20232024-OL-ICT-Marking-Scheme-English-Medium.pdf',
    page: 2,
    answers: [
      '4', '3', '4', '2', '4', '4', '2', '2', '3', '3',
      '2', '1', '4', '4', '3', '2', '4', '3', '2', '4',
      '4', '2', '1', '4', '3', '4', '2', '2', '2', '1',
      '3', '1', '4', '2', '2', '4', '3', '3', '1', '4',
    ],
    notes:
      'The grid is a photograph of the key pasted into the Mark Scheme under the ' +
      'heading "3 Paper 1 answers". All eleven 2023 questions that were hand-' +
      'transcribed before this scheme arrived agree with it.',
  },
  {
    year: 2025,
    sourceFile:
      'pastpapers/Marking Scheme/20252026-OL-ICT-Marking-Scheme-English-Medium-Past-Papers-WiKi.pdf',
    page: 1,
    answers: [
      '3', '3', '2', '4', '3', '2', '2', '3', '4', '4',
      '3', '2', '3', '2', '2', '3', '2', '1', '4', '2',
      '4', '2', '4', '3', 'all', '2', 'all', '4', '1', '1',
      '2', '2', '1', '2', '3', '4', '1', '3', '2', '1',
    ],
    notes: 'Q25 and Q27 were both voided (all options accepted).',
  },
];

/* ------------------------------------------------------------------ *
 * THIRD-PARTY ANSWER LISTS — NOT OFFICIAL, NEVER AUTHORITATIVE
 * ------------------------------------------------------------------ */

/**
 * Answer lists published by tuition providers and private authors.
 *
 * Some files in `pastpapers/Marking Scheme/` are NOT Department of
 * Examinations documents at all. They are photographs of commercial answer
 * booklets, or one teacher's own working. They are kept separate from
 * `OFFICIAL_ANSWER_KEYS` and are deliberately given a different shape so
 * that no code path can confuse the two.
 *
 * They may NEVER produce `answer_confidence: 'official_key'`, and the seeder
 * never marks an option correct from them. Their only legitimate use is as a
 * cross-check a human reviewer can consult while working out an answer — the
 * same way a teacher would glance at a published answer book, and with the
 * same amount of trust.
 *
 * How to tell: an official scheme is headed "Department of Examinations -
 * Sri Lanka" and "Confidential", and carries the Department's watermark.
 * These carry a tuition site's watermark or an author's name instead.
 */
export type UnofficialAnswerSource = {
  year: number;
  sourceFile: string;
  page: number;
  /** Who published it — recorded so a reviewer can weigh it. */
  attribution: string;
  /** '?' where the author themselves recorded no answer. */
  answers: readonly string[];
  /** Whether a matching question paper exists in this repository at all. */
  paperHeld: boolean;
  notes?: string;
};

export const UNOFFICIAL_ANSWER_SOURCES: readonly UnofficialAnswerSource[] = [
  {
    year: 2013,
    sourceFile:
      'pastpapers/Marking Scheme/2013-OL-Information-And-Communication-Technology-Marking-Scheme-English-Medium (1).pdf',
    page: 1,
    attribution: 'Commercial answer booklet, photographed; watermarked ict.altechnology.lk',
    answers: [
      '2', '1', '1', '3', '1', '3', '3', '4', '3', '2',
      '1', '4', '2', '2', '3', '4', '4', '2', '2', '3',
      '1', '4', '3', '1', '2', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '',
    ],
    paperHeld: false,
    notes:
      'UNUSABLE IN PRACTICE. We hold no 2013 question paper — the file supplied ' +
      'under that name duplicates 2012 — so there is nothing to attach these ' +
      'answers to. Only rows 1-25 were legible; recorded so the position is ' +
      'documented if the paper is ever sourced.',
  },
  {
    year: 2015,
    sourceFile:
      'pastpapers/Marking Scheme/2015-OL-Information-And-Communication-Technology-Marking-Scheme-English-Medium (1).pdf',
    page: 1,
    attribution: 'Private answer booklet, photographed; watermarked "Charitha Nagasinghe"',
    answers: [
      '3', '2', '4', '2', '1', '1', '1', '3', '2', '3',
      '3', '1,4', '4', '2', '4', '4', '2', '1', '4', '2',
      '3', '1', '1', '4', '1,3', '1', '2', '4', '2', '2',
      '4', '2', '4', '4', '1', '2', '2', '2', '1', '4',
    ],
    paperHeld: true,
  },
  {
    year: 2016,
    sourceFile:
      'pastpapers/Marking Scheme/2016-OL-Information-And-Communication-Technology-Marking-Scheme-English-Medium (2).pdf',
    page: 1,
    attribution: 'Commercial answer booklet, photographed; watermarked ict.altechnology.lk',
    answers: [
      '2', '3', '1', '1', '2', '2', '2', '3', '1,4', '2',
      '4', '1', '2', '2', '2', '4', '2', '3', '1', '4',
      '3', '1', '4', '1', '3', '4', '3', '4', '3', '1',
      '3', '2', '1', '3', '4', '2', '4', '1', '1', '3',
    ],
    paperHeld: true,
  },
  {
    year: 2024,
    sourceFile:
      'pastpapers/Marking Scheme/ict-2024-2025-tentative-marking-scheme-by-alric-prashanth-0777110322-pr_b17337da3c46d5fc5aee7c92ebb226a5.pdf',
    page: 1,
    attribution: 'Mr. S. Alric Prashanth, ICT teacher — self-described "Tentative Marking Scheme"',
    answers: [
      '4', '3', '4', '4', '4', '3', '2', '2', '1', '4',
      '1', '2', '3', '2', '2', '2', '3', '3', '3', '4',
      '4', '2', '4', '3', '3', '2', '3', '2', '2', '4',
      '4', '1', '2', '?', '3', '4', '3', '3', '1', '4',
    ],
    paperHeld: true,
    notes:
      'The document calls itself tentative on its own title page, and records ' +
      '"?" for Q34 — the author did not know that answer either.',
  },
];

/** Years for which we hold an official Paper I key. */
export const YEARS_WITH_OFFICIAL_KEY: readonly number[] =
  OFFICIAL_ANSWER_KEYS.map((k) => k.year);

/** Years where the only answer list we hold is a third-party one. */
export const YEARS_WITH_ONLY_UNOFFICIAL_KEY: readonly number[] =
  UNOFFICIAL_ANSWER_SOURCES.filter(
    (u) => u.paperHeld && !YEARS_WITH_OFFICIAL_KEY.includes(u.year),
  ).map((u) => u.year);

/** True when the Department accepted exactly one option. */
export function isSingleAnswer(answer: OfficialAnswer): boolean {
  return answer === '1' || answer === '2' || answer === '3' || answer === '4';
}

/** 0-based index into the option list, or null for a voided/multi-accept item. */
export function correctIndex(answer: OfficialAnswer): 0 | 1 | 2 | 3 | null {
  if (!isSingleAnswer(answer)) return null;
  return (Number(answer) - 1) as 0 | 1 | 2 | 3;
}

const KEYS_BY_YEAR = new Map(OFFICIAL_ANSWER_KEYS.map((k) => [k.year, k]));

/** The official answer for one question, or null if that year has no scheme. */
export function officialAnswer(year: number, questionNumber: number): OfficialAnswer | null {
  const key = KEYS_BY_YEAR.get(year);
  if (!key) return null;
  return key.answers[questionNumber - 1] ?? null;
}

/**
 * A third-party suggestion for one question, for a reviewer to weigh.
 * Returns null when we hold an official key for that year — the official key
 * is the authority and a reviewer should never be shown a competing guess.
 */
export function unofficialSuggestion(
  year: number,
  questionNumber: number,
): { answer: string; attribution: string } | null {
  if (YEARS_WITH_OFFICIAL_KEY.includes(year)) return null;
  const src = UNOFFICIAL_ANSWER_SOURCES.find((u) => u.year === year && u.paperHeld);
  const answer = src?.answers[questionNumber - 1];
  if (!src || !answer || answer === '?') return null;
  return { answer, attribution: src.attribution };
}

export const ANSWER_KEY_STATS = {
  yearsKeyed: OFFICIAL_ANSWER_KEYS.length,
  questionsKeyed: OFFICIAL_ANSWER_KEYS.length * 40,
  voidedOrMultiAccept: OFFICIAL_ANSWER_KEYS.reduce(
    (n, k) => n + k.answers.filter((a) => !isSingleAnswer(a)).length,
    0,
  ),
  yearsWithOnlyUnofficialKey: YEARS_WITH_ONLY_UNOFFICIAL_KEY.length,
} as const;
