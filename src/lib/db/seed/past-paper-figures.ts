/**
 * The figures that belong to past-paper questions — logic circuits, truth
 * tables, flowcharts, spreadsheet segments, database tables, network diagrams.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE QUESTION TEXT
 * -------------------------------------------------
 * The OCR pipeline reads pixels and emits characters, so a logic circuit comes
 * out of it as `= A —=)>= CS b t=` and a spreadsheet segment comes out as
 * nothing at all. For a large share of O/L ICT questions the picture *is* the
 * question: "Consider the following logic circuit" is unanswerable without it,
 * and no amount of repairing the stem fixes that.
 *
 * `tools/extract-past-papers/figures.py` therefore reads the PDFs directly,
 * finds the region each figure occupies and re-renders it. It covers the six
 * born-digital papers (2020-2025) only. The nine scanned years still have no
 * figures — see the README.
 *
 * WHAT A ROW CLAIMS, AND WHAT IT DOES NOT
 * ---------------------------------------
 * A row claims that a picture was found in a particular place in the paper and
 * that the question printed above it was the one it belongs to. That is a
 * claim about *layout*, not about meaning: nothing in the pipeline has looked
 * at the picture. So:
 *
 *   - `altText` is null here, and the seeder writes an explicit
 *     "not yet described" placeholder rather than inventing a description. A
 *     generated alt text would be a guess presented to a screen reader as
 *     fact, which is worse than an honest gap.
 *   - Attaching a figure does not upgrade a question's `extraction` grade or
 *     its `answerConfidence`, and it never makes a question publishable. It
 *     shortens the reviewer's work; it does not do it.
 *
 * The extractor errs towards capturing too much. A few regions are option
 * lists that happen to be drawn with vector arrows rather than real diagrams.
 * That direction is the safe one — an unnecessary image in the review queue
 * costs a reviewer a glance, a missing one costs a student the question.
 */

import raw from './data/past-paper-figures.json';

export type PastPaperFigure = {
  year: number;
  /** Every question the figure serves. More than one means a shared stimulus. */
  questions: number[];
  /** True when the paper introduced it as "Questions 19 to 21 are based on...". */
  shared: boolean;
  /** Web path, served from `public/`. */
  path: string;
  /** Page of the source PDF, so a reviewer can find it again. */
  page: number;
  width: number;
  height: number;
  byteSize: number;
  /** Always null from the extractor. A human writes this. */
  altText: string | null;
  /** The question or shared-stimulus line the figure was anchored to. */
  anchorText: string;
};

export const PAST_PAPER_FIGURES: readonly PastPaperFigure[] =
  raw as PastPaperFigure[];

/** Placeholder alt text. `assets.alt_text` is NOT NULL, and honesty beats a guess. */
export function placeholderAlt(f: PastPaperFigure): string {
  const qs =
    f.questions.length > 1
      ? `questions ${f.questions.slice(0, -1).join(', ')} and ${f.questions.at(-1)}`
      : `question ${f.questions[0]}`;
  return (
    `Figure from the ${f.year} paper (page ${f.page}), ${qs}. ` +
    'Not yet described — a reviewer must write alt text before this question ' +
    'can be published.'
  );
}

/** The caption a shared stimulus carries: the paper's own wording. */
export function caption(f: PastPaperFigure): string | null {
  return f.shared ? f.anchorText.trim() : null;
}

/** Figures for one paper, keyed by the question they serve. */
export function figuresByQuestion(year: number): Map<number, PastPaperFigure[]> {
  const map = new Map<number, PastPaperFigure[]>();
  for (const f of PAST_PAPER_FIGURES) {
    if (f.year !== year) continue;
    for (const q of f.questions) {
      const list = map.get(q) ?? [];
      list.push(f);
      map.set(q, list);
    }
  }
  return map;
}

export const PAST_PAPER_FIGURE_STATS = {
  total: PAST_PAPER_FIGURES.length,
  shared: PAST_PAPER_FIGURES.filter((f) => f.shared).length,
  /** Distinct year+question pairs that now have a picture attached. */
  questionsCovered: new Set(
    PAST_PAPER_FIGURES.flatMap((f) => f.questions.map((q) => `${f.year}-${q}`)),
  ).size,
  years: [...new Set(PAST_PAPER_FIGURES.map((f) => f.year))].sort(),
} as const;
