/**
 * Past-paper records, from the PDFs in ./pastpapers.
 *
 * Two things this file is careful about:
 *
 *  1. ANSWER PROVENANCE. Official Department of Examinations marking schemes
 *     are supplied for 10 of the 15 papers (see ./answer-keys.ts). Those
 *     years, and only those years, can carry `answer_confidence:
 *     'official_key'`.
 *
 *     `hasMarkingScheme` means an OFFICIAL scheme. Some files in
 *     `pastpapers/Marking Scheme/` are commercial answer booklets or one
 *     teacher's own tentative working — 2015, 2016 and 2024. Those are held
 *     in `UNOFFICIAL_ANSWER_SOURCES`, are flagged false here, and can never
 *     key a question. Their years stay `unverified`, and the constraint
 *     `questions_unverified_never_published` keeps them away from students.
 *
 *  2. HONEST PROVENANCE. `ingestion` records what we can actually do with
 *     each source file, so nobody later assumes a paper is missing when it
 *     is really just a scan awaiting OCR.
 */

export type IngestionState =
  /** Clean embedded text — can be parsed, then reviewed. */
  | 'text_layer'
  /** Image-only scan — needs OCR before transcription. */
  | 'scanned_ocr_required'
  /** Has a text layer, but a poor one that garbles characters. */
  | 'poor_text_layer'
  /** Referenced by the corpus but not actually present in this repository. */
  | 'missing';

export type PaperSeed = {
  year: number;
  /** As printed on the paper, e.g. '2023(2024)'. */
  sitting: string;
  paperNo: 1 | 2;
  durationMinutes: number;
  totalQuestions: number | null;
  sourceFile: string | null;
  ingestion: IngestionState;
  /**
   * Whether a Department of Examinations marking scheme is held for this
   * paper. Only these years can produce an `official_key` answer.
   */
  hasMarkingScheme: boolean;
  notes?: string;
};

/**
 * Paper I is 40 MCQs; Paper II is five structured questions chosen from
 * seven (20 + 4×10 marks). The two papers together are timed at three hours
 * plus ten minutes' reading time.
 */
export const PAST_PAPERS: PaperSeed[] = [
  {
    year: 2010, sitting: '2010', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2010_english (2).pdf',
    ingestion: 'scanned_ocr_required',
    hasMarkingScheme: false,
  },
  {
    year: 2011, sitting: '2011', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2011_english (2).pdf',
    ingestion: 'scanned_ocr_required',
    hasMarkingScheme: false,
  },
  {
    year: 2012, sitting: 'December 2012', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2012_english (1).pdf',
    ingestion: 'poor_text_layer',
    hasMarkingScheme: true,
    notes:
      'The text layer is a low-quality OCR pass ("oLl20l2t80-E-r"). Treat as a scan and re-OCR before transcription.',
  },
  {
    year: 2013, sitting: '2013', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: null,
    ingestion: 'missing',
    hasMarkingScheme: false,
    notes:
      'NOT PRESENT. The file named "ol_ict_past_paper_2013_english (5).pdf" is byte-identical to the 2012 file (md5 aa1c0caf1605bd96af2a767273280bd3) and its header reads "Ord. Level) Examination, December2012". The genuine 2013 paper still needs to be sourced.',
  },
  {
    year: 2014, sitting: '2014', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2014_english (1).pdf',
    ingestion: 'scanned_ocr_required',
    hasMarkingScheme: true,
  },
  {
    year: 2015, sitting: '2015', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2015_english (1).pdf',
    ingestion: 'scanned_ocr_required',
    hasMarkingScheme: false,
  },
  {
    year: 2016, sitting: '2016', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2016_english (1).pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: false,
  },
  {
    year: 2017, sitting: '2017', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2017_english.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: true,
  },
  {
    year: 2018, sitting: '2018', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2018_english.pdf',
    ingestion: 'scanned_ocr_required',
    hasMarkingScheme: true,
  },
  {
    year: 2019, sitting: '2019', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol_ict_past_paper_2019_english (1).pdf',
    ingestion: 'scanned_ocr_required',
    hasMarkingScheme: true,
  },
  {
    year: 2020, sitting: '2020', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol-2020-english_2024-08-13_02-56-27.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: true,
  },
  {
    year: 2021, sitting: '2021(2022)', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol-2021-english_2024-08-13_02-55-10.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: true,
  },
  {
    year: 2022, sitting: '2022(2023)', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol-2022-english_2024-08-13_02-53-50.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: true,
  },
  {
    year: 2023, sitting: '2023(2024)', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol-2023-english_2024-11-29_19-49-37.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: true,
  },
  {
    year: 2024, sitting: '2024(2025)', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol-2024-english_2026-01-30_11-49-16.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: false,
  },
  {
    year: 2025, sitting: '2025(2026)', paperNo: 1, durationMinutes: 60, totalQuestions: 40,
    sourceFile: 'pastpapers/ol-2025-english_2026-08-14_04-37-43.pdf',
    ingestion: 'text_layer',
    hasMarkingScheme: true,
  },
];

/* ------------------------------------------------------------------ *
 * Transcribed questions
 * ------------------------------------------------------------------ *
 *
 * The eleven hand-typed 2023 questions that used to live here have been
 * superseded by the full extraction in ./past-paper-questions.ts, which
 * covers all 15 available papers and carries an extraction grade per
 * question. Import PAST_PAPER_QUESTIONS from there.
 */

export const PAPER_STATS = {
  totalPapers: PAST_PAPERS.length,
  withUsableText: PAST_PAPERS.filter((p) => p.ingestion === 'text_layer').length,
  needingOcr: PAST_PAPERS.filter(
    (p) => p.ingestion === 'scanned_ocr_required' || p.ingestion === 'poor_text_layer',
  ).length,
  missing: PAST_PAPERS.filter((p) => p.ingestion === 'missing').length,
  withMarkingScheme: PAST_PAPERS.filter((p) => p.hasMarkingScheme).length,
  withoutMarkingScheme: PAST_PAPERS.filter(
    (p) => !p.hasMarkingScheme && p.ingestion !== 'missing',
  ).length,
} as const;
