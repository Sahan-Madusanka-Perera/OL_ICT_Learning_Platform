import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  PAST_PAPER_FIGURES,
  PAST_PAPER_FIGURE_STATS,
  placeholderAlt,
  caption,
  figuresByQuestion,
} from './past-paper-figures';
import { PAST_PAPERS } from './papers';

/**
 * A figure record is a promise that a specific picture exists at a specific
 * path and belongs to a specific question. All three halves of that can rot
 * independently: the file can be deleted, the manifest can be regenerated
 * against a different paper, or an off-by-one in the extractor can walk every
 * figure one question along. These check the promise rather than the count.
 */

const PUBLIC = join(process.cwd(), 'public');

describe('past-paper figures', () => {
  it('points at a file that is actually on disk', () => {
    for (const f of PAST_PAPER_FIGURES) {
      const onDisk = join(PUBLIC, f.path);
      expect(existsSync(onDisk), `${f.year} ${f.path} missing`).toBe(true);
    }
  });

  it('records the byte size the file actually has', () => {
    for (const f of PAST_PAPER_FIGURES) {
      const actual = statSync(join(PUBLIC, f.path)).size;
      expect(actual, `${f.path}`).toBe(f.byteSize);
    }
  });

  it('serves each path from exactly one record', () => {
    const paths = PAST_PAPER_FIGURES.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('only claims years whose paper we actually hold', () => {
    const held = new Set(
      PAST_PAPERS.filter((p) => p.ingestion !== 'missing').map((p) => p.year),
    );
    for (const f of PAST_PAPER_FIGURES) {
      expect(held.has(f.year), `${f.year} is not a held paper`).toBe(true);
    }
  });

  it('numbers every question within the 40 a Paper I has', () => {
    for (const f of PAST_PAPER_FIGURES) {
      expect(f.questions.length).toBeGreaterThan(0);
      for (const q of f.questions) {
        expect(q, `${f.year} ${f.path}`).toBeGreaterThanOrEqual(1);
        expect(q, `${f.year} ${f.path}`).toBeLessThanOrEqual(40);
      }
    }
  });

  /*
   * The Paper I / Paper II cutoff. These PDFs are "E-I,II" — both papers in
   * one file — and Paper II is full of figures of its own. Without the cutoff
   * every structured-question diagram in the second half lands on question 40
   * by way of the carried anchor, which is how the first run of the extractor
   * produced 9 figures for 2020 Q40 alone.
   */
  it('never piles a crowd of figures onto question 40', () => {
    const byQuestion = new Map<string, number>();
    for (const f of PAST_PAPER_FIGURES) {
      for (const q of f.questions) {
        const k = `${f.year}-${q}`;
        byQuestion.set(k, (byQuestion.get(k) ?? 0) + 1);
      }
    }
    for (const [k, n] of byQuestion) {
      expect(n, `${k} has ${n} figures`).toBeLessThanOrEqual(2);
    }
  });

  it('marks a figure shared exactly when it serves more than one question', () => {
    for (const f of PAST_PAPER_FIGURES) {
      if (f.questions.length > 1) expect(f.shared, f.path).toBe(true);
    }
  });

  it('gives a shared figure the paper’s own wording as its caption', () => {
    for (const f of PAST_PAPER_FIGURES.filter((x) => x.shared)) {
      expect(caption(f), f.path).toMatch(/questions?\s+\d/i);
    }
    for (const f of PAST_PAPER_FIGURES.filter((x) => !x.shared)) {
      expect(caption(f)).toBeNull();
    }
  });

  it('has real pixel dimensions', () => {
    for (const f of PAST_PAPER_FIGURES) {
      expect(f.width, f.path).toBeGreaterThan(0);
      expect(f.height, f.path).toBeGreaterThan(0);
      expect(f.byteSize, f.path).toBeGreaterThan(0);
    }
  });

  /*
   * The accessibility claim. Nothing in the extractor has looked at a picture,
   * so no row may arrive carrying a description — a generated one would reach a
   * screen reader as if it were fact. The placeholder must say so out loud.
   */
  it('ships no invented alt text', () => {
    for (const f of PAST_PAPER_FIGURES) {
      expect(f.altText, f.path).toBeNull();
    }
  });

  it('writes a placeholder that admits it is not a description', () => {
    for (const f of PAST_PAPER_FIGURES) {
      const alt = placeholderAlt(f);
      expect(alt).toContain('Not yet described');
      expect(alt).toContain(String(f.year));
      expect(alt).toContain(String(f.questions[0]));
    }
  });

  it('names every served question in the placeholder for a shared figure', () => {
    const shared = PAST_PAPER_FIGURES.find((f) => f.questions.length > 2);
    expect(shared, 'expected at least one figure serving 3+ questions').toBeDefined();
    if (!shared) return;
    for (const q of shared.questions) {
      expect(placeholderAlt(shared)).toContain(String(q));
    }
  });

  it('indexes a shared figure under each question it serves', () => {
    for (const f of PAST_PAPER_FIGURES) {
      const index = figuresByQuestion(f.year);
      for (const q of f.questions) {
        expect(index.get(q)?.some((x) => x.path === f.path), `${f.year} Q${q}`).toBe(
          true,
        );
      }
    }
  });

  /*
   * Coverage is deliberately asserted as a floor, not an equality: re-running
   * the extractor with a better heuristic should not break the suite. A drop
   * means figures were lost, which is the direction worth failing on.
   */
  it('covers the six born-digital papers and nothing else', () => {
    expect(PAST_PAPER_FIGURE_STATS.years).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
  });

  /*
   * `ingestion: 'text_layer'` is a wider set than this — 2016 and 2017 carry
   * one too. Theirs is OCR baked over a page scan: each page is a single
   * full-bleed image with zero vector drawings, so there are no figure regions
   * to find, only ink on a photograph. A text layer says the *words* can be
   * read, not that the pictures can be lifted.
   */
  it('does not mistake an OCR-over-scan text layer for a born-digital paper', () => {
    for (const year of [2012, 2016, 2017]) {
      const paper = PAST_PAPERS.find((p) => p.year === year);
      expect(paper?.ingestion, `${year}`).not.toBe('scanned_ocr_required');
      expect(PAST_PAPER_FIGURE_STATS.years).not.toContain(year);
    }
  });

  it('keeps at least the coverage the extractor has reached', () => {
    expect(PAST_PAPER_FIGURE_STATS.total).toBeGreaterThanOrEqual(37);
    expect(PAST_PAPER_FIGURE_STATS.questionsCovered).toBeGreaterThanOrEqual(53);
    expect(PAST_PAPER_FIGURE_STATS.shared).toBeGreaterThanOrEqual(8);
  });

  /* The nine scanned years need region detection and have no figures yet. */
  it('claims nothing for the scanned years', () => {
    const scanned = [2010, 2011, 2012, 2014, 2015, 2016, 2017, 2018, 2019];
    for (const year of scanned) {
      expect(figuresByQuestion(year).size, `${year}`).toBe(0);
    }
  });
});
