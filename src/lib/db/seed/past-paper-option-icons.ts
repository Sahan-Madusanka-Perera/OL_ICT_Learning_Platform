/**
 * Answer options that are pictures rather than words.
 *
 * `question_options.asset_id` has existed since the first schema, with a note
 * saying a large share of real O/L ICT MCQs are picture questions. These are
 * the rows that fill it. Eight questions across four born-digital papers ask
 * which icon performs a job, and their options are 15-to-25-point images with
 * no text beside them whatsoever:
 *
 *   2022 Q13  which pair of icons makes two kinds of list
 *   2022 Q39  which control in an email composer attaches a file
 *   2023 Q13  which alignment icon
 *   2023 Q15  which icon formats a character as a subscript
 *   2024 Q11  which icon undoes a deletion
 *   2025 Q11, Q12, Q13  centre align, superscript, strike-through
 *
 * Each icon carries alt text written by looking at the rendered image. That is
 * not optional here in the way it is for a decorative picture — for these
 * questions the options *are* the pictures, so a student on a screen reader has
 * nothing at all to choose between without it.
 *
 * The descriptions say what is drawn and stop there. "A paperclip drawn
 * upright" is what a sighted candidate sees; "the attach button" is the answer,
 * and writing that would hand the question away to exactly the readers the
 * description exists to serve.
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
  years: [...new Set(OPTION_ICONS.map((i) => i.year))].sort((a, b) => a - b),
} as const;
