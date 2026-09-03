/**
 * Figures for the model questions.
 *
 * The difference from `past-paper-figures.ts` is worth stating plainly: those
 * are *recovered* from a PDF by a pipeline that has never looked at the picture,
 * so they carry a "not yet described" placeholder and cannot be published. These
 * are *authored* — drawn by `tools/model-figures/build.py` — so we know exactly
 * what each one shows and every single one ships real alt text.
 *
 * That is the whole reason a model question is allowed to depend on a figure at
 * all. "Consider the following logic circuit" is unanswerable without the
 * circuit, and for a student using a screen reader it is unanswerable without a
 * description that is genuinely equivalent to it. So the alt text here describes
 * the *structure* of each figure — which gate feeds which, what is in each cell
 * — and never the answer.
 */

import raw from './data/model-figures.json';

export type ModelFigure = {
  /** Stable id referenced by `QuestionSeed.figure`. */
  slug: string;
  /** Web path, served from `public/`. */
  path: string;
  /** A real description. Never a placeholder. */
  alt: string;
  width: number;
  height: number;
  byteSize: number;
};

export const MODEL_FIGURES: readonly ModelFigure[] = raw as ModelFigure[];

const bySlug = new Map(MODEL_FIGURES.map((f) => [f.slug, f]));

export function figureBySlug(slug: string): ModelFigure | undefined {
  return bySlug.get(slug);
}

export const MODEL_FIGURE_STATS = {
  total: MODEL_FIGURES.length,
  bytes: MODEL_FIGURES.reduce((n, f) => n + f.byteSize, 0),
} as const;
