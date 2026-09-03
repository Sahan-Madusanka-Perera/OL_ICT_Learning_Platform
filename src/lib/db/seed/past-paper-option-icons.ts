/**
 * Answer options that are pictures rather than words.
 *
 * `question_options.asset_id` has existed since the first schema, with a note
 * saying a large share of real O/L ICT MCQs are picture questions. These are
 * the first rows to fill it: questions 11, 12 and 13 of the 2025 paper ask
 * which word-processor icon performs a job, and each option is a 23-point icon
 * with no text beside it whatsoever.
 *
 * Each icon carries alt text written by looking at the rendered image. That is
 * not optional here in the way it is for a decorative picture — for these three
 * questions the options *are* the pictures, so a student on a screen reader has
 * nothing at all to choose between without it.
 */

import raw from './data/past-paper-option-icons.json';

export type OptionIcon = {
  year: number;
  q: number;
  /** 1-based option number, matching the label printed on the paper. */
  option: number;
  path: string;
  alt: string;
  width: number;
  height: number;
  byteSize: number;
};

export const OPTION_ICONS: readonly OptionIcon[] = raw as OptionIcon[];

/** Icons for one question, ordered 1-4, or null when it has none. */
export function iconsFor(year: number, q: number): OptionIcon[] | null {
  const icons = OPTION_ICONS.filter((i) => i.year === year && i.q === q).sort(
    (a, b) => a.option - b.option,
  );
  return icons.length === 4 ? icons : null;
}

export const OPTION_ICON_STATS = {
  total: OPTION_ICONS.length,
  questions: new Set(OPTION_ICONS.map((i) => `${i.year}-${i.q}`)).size,
} as const;
