import { describe, it, expect } from 'vitest';

import {
  OFFICIAL_ANSWER_KEYS,
  UNOFFICIAL_ANSWER_SOURCES,
  YEARS_WITH_OFFICIAL_KEY,
  ANSWER_KEY_STATS,
  isSingleAnswer,
  correctIndex,
  officialAnswer,
  unofficialSuggestion,
} from './answer-keys';
import {
  PAST_PAPER_QUESTIONS,
  PAST_PAPER_QUESTION_STATS,
  isReviewReady,
} from './past-paper-questions';
import { PAST_PAPERS } from './papers';
import { OL_ICT_SYLLABUS } from './syllabus';

/**
 * These guard the two things that would quietly harm a student: an answer key
 * that has drifted from the marking scheme, and a question presented as
 * answerable when its answer is not actually known.
 */

describe('official answer keys', () => {
  it('gives exactly 40 answers for every keyed year', () => {
    for (const key of OFFICIAL_ANSWER_KEYS) {
      expect(key.answers, `${key.year} key length`).toHaveLength(40);
    }
  });

  it('only ever contains 1-4, "all", or an explicit accepted list', () => {
    for (const key of OFFICIAL_ANSWER_KEYS) {
      for (const [i, a] of key.answers.entries()) {
        expect(a, `${key.year} Q${i + 1}`).toMatch(/^(?:[1-4](?:,[1-4])*|all)$/);
      }
    }
  });

  it('names a marking scheme that papers.ts also claims to hold', () => {
    const flagged = new Set(PAST_PAPERS.filter((p) => p.hasMarkingScheme).map((p) => p.year));
    const keyed = new Set(OFFICIAL_ANSWER_KEYS.map((k) => k.year));
    expect([...keyed].sort()).toEqual([...flagged].sort());
  });

  it('covers 10 years and 400 questions', () => {
    expect(ANSWER_KEY_STATS.yearsKeyed).toBe(10);
    expect(ANSWER_KEY_STATS.questionsKeyed).toBe(400);
  });

  /*
   * Spot checks against questions whose answer can be derived from first
   * principles rather than trusted. If a key were misread while transcribing
   * the scanned grid, these are what would catch it.
   */
  it('agrees with independently derivable answers', () => {
    // 2019 Q11 — 'E' is 69, so 'G' is 71 = 1000111.
    expect(officialAnswer(2019, 11)).toBe('2');
    // 2019 Q33 — 32 colours needs 5 bits (2^5 = 32).
    expect(officialAnswer(2019, 33)).toBe('2');
    // 2019 Q36 — units = 175 -> 250 + (175-150)*5 = 375, the fourth option.
    expect(officialAnswer(2019, 36)).toBe('4');
    // 2019 Q39 — a=50,b=30,c=70: a>b holds, a>c does not, so value = c = 70.
    expect(officialAnswer(2019, 39)).toBe('4');
  });

  it('returns null for a year with no official marking scheme', () => {
    expect(officialAnswer(2010, 1)).toBeNull();
    expect(officialAnswer(2011, 1)).toBeNull();
    expect(officialAnswer(2015, 1)).toBeNull();
    expect(officialAnswer(2016, 1)).toBeNull();
    expect(officialAnswer(2024, 1)).toBeNull();
  });

  /*
   * The 2023 scheme arrived after eleven of its questions had already been
   * hand-transcribed and independently reasoned about. Every one agreed.
   */
  it('agrees with the 2023 questions transcribed before it arrived', () => {
    expect(officialAnswer(2023, 2)).toBe('3');  // OCR device captures printed text
    expect(officialAnswer(2023, 3)).toBe('4');  // USB flash drive is solid state
    expect(officialAnswer(2023, 4)).toBe('2');  // the CPU executes instructions
    expect(officialAnswer(2023, 5)).toBe('4');  // a star topology needs a switch
    expect(officialAnswer(2023, 6)).toBe('4');  // 216(10) = 330(8)
    expect(officialAnswer(2023, 7)).toBe('2');  // 10001000(2) = 136(10)
    expect(officialAnswer(2023, 8)).toBe('2');  // 1572(8) = 890 = 37A(16)
    expect(officialAnswer(2023, 9)).toBe('3');  // 1 TB = 1024^3 KB
    expect(officialAnswer(2023, 12)).toBe('1'); // Ctrl+A selects all
  });

  it('agrees with independently derivable 2020 answers', () => {
    expect(officialAnswer(2020, 2)).toBe('1');  // input, process, output
    expect(officialAnswer(2020, 22)).toBe('4'); // HTML is not authored in a browser
    expect(officialAnswer(2020, 31)).toBe('3'); // resolution is width x height
  });
});

describe('third-party answer lists', () => {
  it('are never treated as official', () => {
    for (const src of UNOFFICIAL_ANSWER_SOURCES) {
      if (src.paperHeld) {
        // A year may have both only if the official one arrived later; in that
        // case the official key must win and the suggestion must fall silent.
        if (YEARS_WITH_OFFICIAL_KEY.includes(src.year)) {
          expect(unofficialSuggestion(src.year, 1)).toBeNull();
        }
      }
    }
  });

  it('offer a suggestion only for a year with no official key', () => {
    expect(unofficialSuggestion(2015, 1)).not.toBeNull();
    expect(unofficialSuggestion(2016, 1)).not.toBeNull();
    expect(unofficialSuggestion(2024, 1)).not.toBeNull();
    // official years must never surface a competing guess
    for (const year of YEARS_WITH_OFFICIAL_KEY) {
      expect(unofficialSuggestion(year, 1), `year ${year}`).toBeNull();
    }
  });

  it('never suggests an answer the author did not give', () => {
    // 2024 Q34 is recorded as '?' in the source document.
    expect(unofficialSuggestion(2024, 34)).toBeNull();
  });

  it('never suggests anything for a year whose paper we do not hold', () => {
    expect(unofficialSuggestion(2013, 1)).toBeNull();
    expect(UNOFFICIAL_ANSWER_SOURCES.find((u) => u.year === 2013)?.paperHeld).toBe(false);
  });

  it('records who published each list, so a reviewer can weigh it', () => {
    for (const src of UNOFFICIAL_ANSWER_SOURCES) {
      expect(src.attribution.length).toBeGreaterThan(20);
    }
  });
});

describe('voided and multi-accept questions', () => {
  it('are recognised as having no single answer', () => {
    expect(isSingleAnswer('all')).toBe(false);
    expect(isSingleAnswer('3,4')).toBe(false);
    expect(isSingleAnswer('1,2,3')).toBe(false);
    expect(isSingleAnswer('3')).toBe(true);
  });

  it('never yield a correct option index', () => {
    expect(correctIndex('all')).toBeNull();
    expect(correctIndex('3,4')).toBeNull();
    expect(correctIndex('3')).toBe(2);
  });

  /*
   * 2012 Q16 (1,2,3) · 2017 Q27 (all) · 2017 Q37 (3,4) · 2018 Q37 (all) ·
   * 2022 Q30 (all) · 2025 Q25 (all) · 2025 Q27 (all).
   */
  it('are the seven the marking schemes actually void', () => {
    expect(ANSWER_KEY_STATS.voidedOrMultiAccept).toBe(7);
  });
});

describe('extracted past-paper questions', () => {
  it('has no duplicate year/question pair', () => {
    const seen = new Set<string>();
    for (const q of PAST_PAPER_QUESTIONS) {
      const k = `${q.year}-${q.questionNumber}`;
      expect(seen.has(k), `duplicate ${k}`).toBe(false);
      seen.add(k);
    }
  });

  it('numbers every question 1-40 of a paper we actually hold', () => {
    const present = new Set(
      PAST_PAPERS.filter((p) => p.ingestion !== 'missing').map((p) => p.year),
    );
    for (const q of PAST_PAPER_QUESTIONS) {
      expect(q.questionNumber).toBeGreaterThanOrEqual(1);
      expect(q.questionNumber).toBeLessThanOrEqual(40);
      expect(present.has(q.year), `year ${q.year} has no paper`).toBe(true);
    }
  });

  it('carries no question from the missing 2013 paper', () => {
    expect(PAST_PAPER_QUESTIONS.some((q) => q.year === 2013)).toBe(false);
  });

  it('gives four options whenever options are present at all', () => {
    for (const q of PAST_PAPER_QUESTIONS) {
      if (q.options) expect(q.options, `${q.year} Q${q.questionNumber}`).toHaveLength(4);
    }
  });

  it('assigns every question to a topic that exists in the syllabus', () => {
    const codes = new Set(
      OL_ICT_SYLLABUS.flatMap((u) => u.topics.map((t) => t.code)),
    );
    for (const q of PAST_PAPER_QUESTIONS) {
      expect(codes.has(q.topic), `${q.year} Q${q.questionNumber} -> ${q.topic}`).toBe(true);
    }
  });

  it('derives correctIndex only from a single official answer', () => {
    for (const q of PAST_PAPER_QUESTIONS) {
      if (q.correctIndex === null) continue;
      expect(q.officialAnswer).not.toBeNull();
      expect(isSingleAnswer(q.officialAnswer!)).toBe(true);
      expect(q.correctIndex).toBe(Number(q.officialAnswer) - 1);
    }
  });

  it('never claims an answer for a year with no marking scheme', () => {
    const keyed = new Set(OFFICIAL_ANSWER_KEYS.map((k) => k.year));
    for (const q of PAST_PAPER_QUESTIONS) {
      if (!keyed.has(q.year)) {
        expect(q.officialAnswer, `${q.year} Q${q.questionNumber}`).toBeNull();
        expect(q.correctIndex).toBeNull();
      }
    }
  });

  it('marks a question review-ready only with clean text AND a single answer', () => {
    for (const q of PAST_PAPER_QUESTIONS.filter(isReviewReady)) {
      expect(q.extraction).toBe('clean');
      expect(q.options).not.toBeNull();
      expect(q.correctIndex).not.toBeNull();
    }
  });

  it('reports counts that match the data', () => {
    const s = PAST_PAPER_QUESTION_STATS;
    expect(s.total).toBe(PAST_PAPER_QUESTIONS.length);
    const sum =
      s.byExtraction.clean +
      s.byExtraction.needsAsset +
      s.byExtraction.needsRepair +
      s.byExtraction.incomplete;
    expect(sum).toBe(s.total);
    expect(s.reviewReady).toBeLessThanOrEqual(s.byExtraction.clean);
    expect(s.withSingleOfficialAnswer).toBeLessThanOrEqual(s.withOfficialAnswer);
  });
});
