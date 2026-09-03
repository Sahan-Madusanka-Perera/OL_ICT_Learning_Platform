import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

import {
  VERIFIED_QUESTIONS,
  VERIFIED_STATS,
  VERIFIED_YEARS,
  isVerified,
} from './past-paper-verified';
import { OPTION_ICONS, iconsFor, OPTION_ICON_STATS } from './past-paper-option-icons';
import { officialAnswer, isSingleAnswer, correctIndex } from './answer-keys';
import { OL_ICT_SYLLABUS } from './syllabus';

/**
 * A verified transcription makes a much stronger claim than an OCR one: that
 * the text *is* the paper. These guard the things that would quietly make that
 * claim false — a missing question, a lost subscript, a topic that does not
 * exist, or an icon question whose pictures never arrived.
 */

const PUBLIC = join(process.cwd(), 'public');
const q2025 = VERIFIED_QUESTIONS.filter((q) => q.year === 2025);

describe('the 2025 transcription', () => {
  it('has all forty questions, numbered 1 to 40 with no gaps', () => {
    expect(q2025).toHaveLength(40);
    expect(q2025.map((q) => q.questionNumber).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 40 }, (_, i) => i + 1),
    );
  });

  it('gives every question either four text options or four pictures', () => {
    for (const q of q2025) {
      if (q.imageOptions) {
        expect(iconsFor(q.year, q.questionNumber), `Q${q.questionNumber}`).toHaveLength(4);
      } else {
        expect(q.options, `Q${q.questionNumber}`).toHaveLength(4);
        expect(new Set(q.options).size, `Q${q.questionNumber} duplicate option`).toBe(4);
        for (const o of q.options!) expect(o.length, `Q${q.questionNumber}`).toBeGreaterThan(0);
      }
    }
  });

  it('leaves no option marker stranded in a stem', () => {
    for (const q of q2025) {
      expect(q.stem, `Q${q.questionNumber}`).not.toMatch(/\(3\)|\(4\)/);
    }
  });

  /*
   * The single most valuable thing the text layer gives back. OCR turns
   * `1110 1110₂` into `1110 11102` and `65₁₀` into `6510`, which does not look
   * broken — it looks like a different number. If these ever revert to ASCII
   * digits, the questions have silently changed meaning.
   */
  it('keeps the subscripts that OCR destroys', () => {
    const q6 = q2025.find((q) => q.questionNumber === 6)!;
    expect(q6.stem).toContain('1110 1110₂');
    expect(q6.options).toContain('EE₁₆');

    const q8 = q2025.find((q) => q.questionNumber === 8)!;
    expect(q8.stem).toContain('65₁₀');
    expect(q8.stem).toContain('0100 0011₂');
  });

  it('keeps the superscripts too', () => {
    const q12 = q2025.find((q) => q.questionNumber === 12)!;
    expect(q12.stem).toContain('X²');

    const q38 = q2025.find((q) => q.questionNumber === 38)!;
    expect(q38.options).toContain('2⁸');
  });

  /*
   * Reading order. All three of these arrived wrong from the raw text stream
   * and are the reason lines are banded and sorted by (y, x) rather than taken
   * as the PDF emits them.
   */
  it('attaches question 10 statements to question 10, not to 14', () => {
    const q10 = q2025.find((q) => q.questionNumber === 10)!;
    const q14 = q2025.find((q) => q.questionNumber === 14)!;
    expect(q10.stem).toContain('A –');
    expect(q10.stem).not.toContain('P –');
    expect(q14.stem).toContain('P –');
    expect(q14.stem).not.toContain('A –');
  });

  it('does not bleed a stimulus into the option above it', () => {
    const q18 = q2025.find((q) => q.questionNumber === 18)!;
    expect(q18.options![3]).toBe('Google Sheets, LibreOffice Calc, Ubuntu');

    const q28 = q2025.find((q) => q.questionNumber === 28)!;
    expect(q28.options![3]).toBe('while-do');

    const q36 = q2025.find((q) => q.questionNumber === 36)!;
    expect(q36.options![3]).toBe('192.246.11.254');
  });

  it('orders question 38 options 1 to 4 despite their one-point offset', () => {
    const q38 = q2025.find((q) => q.questionNumber === 38)!;
    expect(q38.options).toEqual(['3', '8', '2⁸', '2⁸ × 1920 × 1080']);
  });

  it('captures the shared stimulus for every question group that has one', () => {
    for (const n of [19, 20, 21, 25, 26, 27, 28, 29, 30, 31, 32, 33, 37, 38]) {
      const q = q2025.find((x) => x.questionNumber === n)!;
      expect(q.stimulus, `Q${n}`).not.toBeNull();
    }
  });

  it('carries the Pascal fragment the code questions depend on', () => {
    const q30 = q2025.find((q) => q.questionNumber === 30)!;
    expect(q30.stimulus).toContain('sum :=');
    expect(q30.stimulus).toContain('SIZE');
  });
});

describe('topics assigned by hand', () => {
  it('names a topic that exists in the syllabus', () => {
    const codes = new Set(OL_ICT_SYLLABUS.flatMap((u) => u.topics.map((t) => t.code)));
    for (const q of VERIFIED_QUESTIONS) {
      expect(codes.has(q.topic), `Q${q.questionNumber} -> ${q.topic}`).toBe(true);
    }
  });

  /*
   * The keyword classifier put 11 of the 40 in its fallback bucket, 1.2. A hand
   * pass that still leaves questions there has not been done.
   */
  it('does not fall back to 1.2 for a paper that never mentions it', () => {
    expect(q2025.filter((q) => q.topic === '1.2')).toHaveLength(0);
  });

  it('spreads across the paper rather than clustering in one unit', () => {
    expect(VERIFIED_STATS.topics).toBeGreaterThanOrEqual(20);
  });

  it('puts the Pascal code questions on the Pascal topic', () => {
    for (const n of [28, 29, 30, 31, 32, 33]) {
      expect(q2025.find((q) => q.questionNumber === n)!.topic, `Q${n}`).toBe('10.4');
    }
  });

  it('puts the flowchart trace questions on algorithm representation', () => {
    for (const n of [25, 26, 27]) {
      expect(q2025.find((q) => q.questionNumber === n)!.topic, `Q${n}`).toBe('10.3');
    }
  });
});

describe('the official key against the transcription', () => {
  it('keys 38 of the 40, and voids exactly the two the Department voided', () => {
    const voided = q2025.filter((q) => {
      const a = officialAnswer(2025, q.questionNumber);
      return a !== null && !isSingleAnswer(a);
    });
    expect(voided.map((q) => q.questionNumber)).toEqual([25, 27]);
  });

  it('points at an option that actually exists', () => {
    for (const q of q2025) {
      const a = officialAnswer(2025, q.questionNumber);
      if (a === null || !isSingleAnswer(a)) continue;
      const i = correctIndex(a);
      expect(i, `Q${q.questionNumber}`).not.toBeNull();
      expect(i!).toBeGreaterThanOrEqual(0);
      expect(i!).toBeLessThanOrEqual(3);
    }
  });

  /*
   * Spot checks that can be derived rather than trusted. If the transcription
   * and the key had drifted apart, these are where it would show.
   */
  it('agrees with answers that can be worked out independently', () => {
    const keyed = (n: number) => {
      const q = q2025.find((x) => x.questionNumber === n)!;
      const a = officialAnswer(2025, n)!;
      return q.options![correctIndex(a)!];
    };

    // 1110 1110 in binary is EE in hex.
    expect(parseInt('11101110', 2).toString(16).toUpperCase()).toBe('EE');
    expect(keyed(6)).toBe('EE₁₆');

    // 0100 0011 is 67, and 67 is 'C' when 'A' is 65.
    expect(String.fromCharCode(parseInt('01000011', 2))).toBe('C');
    expect(keyed(8)).toBe('C');

    // B2:D4 is 3 columns by 3 rows.
    expect(3 * 3).toBe(9);
    expect(keyed(16)).toBe('9');

    // 8 bits per pixel is one byte per pixel, so bytes = width × height.
    expect(keyed(37)).toBe('1920 × 1080');

    // 8 bits per pixel gives 2^8 distinct colours.
    expect(keyed(38)).toBe('2⁸');
  });
});

describe('picture-only options', () => {
  it('covers questions 11, 12 and 13 with four icons each', () => {
    expect(OPTION_ICON_STATS.questions).toBe(3);
    expect(OPTION_ICON_STATS.total).toBe(12);
    for (const n of [11, 12, 13]) expect(iconsFor(2025, n), `Q${n}`).toHaveLength(4);
  });

  it('points at a file that is on disk, at the size it claims', () => {
    for (const icon of OPTION_ICONS) {
      const p = join(PUBLIC, icon.path);
      expect(existsSync(p), icon.path).toBe(true);
      expect(statSync(p).size, icon.path).toBe(icon.byteSize);
    }
  });

  /*
   * For these three questions the options *are* the pictures, so alt text is
   * not an enhancement — without it there is literally nothing to choose
   * between. A placeholder here would be worse than useless.
   */
  it('describes every icon, because there is no text to fall back on', () => {
    for (const icon of OPTION_ICONS) {
      expect(icon.alt.length, icon.path).toBeGreaterThan(40);
      expect(icon.alt, icon.path).not.toMatch(/not yet described|placeholder|TODO/i);
      expect(icon.alt, icon.path).toMatch(/icon/i);
    }
  });

  it('gives the four options of a question four different descriptions', () => {
    for (const n of [11, 12, 13]) {
      const alts = iconsFor(2025, n)!.map((i) => i.alt);
      expect(new Set(alts).size, `Q${n}`).toBe(4);
    }
  });
});

describe('what verification does and does not cover', () => {
  it('claims only the years actually read against a marking scheme', () => {
    expect([...VERIFIED_YEARS]).toEqual([2025]);
    expect(isVerified(2025)).toBe(true);
    expect(isVerified(2024)).toBe(false);
    expect(isVerified(2019)).toBe(false);
  });
});
