import { describe, it, expect } from 'vitest';
import { MODEL_QUESTIONS, type QuestionSeed } from './questions';
import { OL_ICT_SYLLABUS } from './syllabus';
import { shuffleAll, shuffleQuestion, answerPositionSpread } from './shuffle';

/**
 * The seed bank is educational content, so it gets tested like code.
 *
 * The arithmetic questions are re-derived here from first principles rather
 * than compared against a copy of the same answer — if the seeded key were
 * wrong, this file would fail.
 */

const find = (fragment: string): QuestionSeed => {
  const matches = MODEL_QUESTIONS.filter((q) => q.stem.includes(fragment));
  expect(matches, `expected exactly one question containing "${fragment}"`).toHaveLength(1);
  return matches[0]!;
};

const keyedAnswer = (q: QuestionSeed) => q.options[q.correct];

describe('structural integrity of the seed bank', () => {
  it('has four options for every question', () => {
    for (const q of MODEL_QUESTIONS) expect(q.options).toHaveLength(4);
  });

  it('has exactly one correct option, and no misconception written against it', () => {
    for (const q of MODEL_QUESTIONS) {
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThanOrEqual(3);
      expect(q.misconceptions[q.correct]).toBe('');
      expect(q.misconceptions.filter((m) => m === '')).toHaveLength(1);
    }
  });

  it('explains every distractor — the thing that makes a question teach', () => {
    for (const q of MODEL_QUESTIONS) {
      q.misconceptions.forEach((m, i) => {
        if (i === q.correct) return;
        expect(m.length, `${q.stem.slice(0, 50)} option ${i}`).toBeGreaterThan(15);
      });
    }
  });

  it('gives every question a substantial explanation', () => {
    for (const q of MODEL_QUESTIONS) {
      expect(q.explanation.length, q.stem.slice(0, 50)).toBeGreaterThan(60);
    }
  });

  it('has no duplicate options within a question', () => {
    for (const q of MODEL_QUESTIONS) {
      expect(new Set(q.options).size, q.stem.slice(0, 50)).toBe(4);
    }
  });

  it('has no duplicate question stems', () => {
    const stems = MODEL_QUESTIONS.map((q) => q.stem);
    expect(new Set(stems).size).toBe(stems.length);
  });

  it('references only topic codes that exist in the syllabus', () => {
    const valid = new Set(OL_ICT_SYLLABUS.flatMap((u) => u.topics.map((t) => t.code)));
    for (const q of MODEL_QUESTIONS) {
      expect(valid.has(q.topic), `unknown topic code "${q.topic}"`).toBe(true);
    }
  });

  it('is served with the answer position balanced, so the bank cannot be gamed', () => {
    // As authored, the correct answer clusters in one position — an ordinary
    // human habit. Shuffling is what makes the served bank fair, so that is
    // what gets asserted here.
    const served = shuffleAll(MODEL_QUESTIONS);
    const spread = answerPositionSpread(served);

    for (const [i, count] of spread.entries()) {
      const share = count / served.length;
      expect(share, `option ${i + 1} holds ${Math.round(share * 100)}% of answers`)
        .toBeGreaterThan(0.12);
      expect(share, `option ${i + 1} holds ${Math.round(share * 100)}% of answers`)
        .toBeLessThan(0.4);
    }
  });

  it('shuffles deterministically, so re-seeding does not move answers', () => {
    for (const q of MODEL_QUESTIONS.slice(0, 10)) {
      const a = shuffleQuestion(q);
      const b = shuffleQuestion(q);
      expect(a.options).toEqual(b.options);
      expect(a.correct).toBe(b.correct);
    }
  });

  it('keeps each option paired with its own misconception through the shuffle', () => {
    for (const q of MODEL_QUESTIONS) {
      const s = shuffleQuestion(q);
      // The correct option still carries no misconception...
      expect(s.misconceptions[s.correct]).toBe('');
      // ...and the option text/misconception pairs are preserved as a set.
      const originalPairs = q.options.map((o, i) => `${o}::${q.misconceptions[i]}`).sort();
      const shuffledPairs = s.options.map((o, i) => `${o}::${s.misconceptions[i]}`).sort();
      expect(shuffledPairs).toEqual(originalPairs);
      // ...and the correct answer is still the same text.
      expect(s.options[s.correct]).toBe(q.options[q.correct]);
    }
  });
});

describe('number-system answers, re-derived independently', () => {
  it('45 in decimal is 101101 in binary', () => {
    expect((45).toString(2)).toBe('101101');
    expect(keyedAnswer(find('45₁₀ expressed in binary'))).toBe('101101₂');
  });

  it('11010110 in binary is 214 in decimal', () => {
    expect(parseInt('11010110', 2)).toBe(214);
    expect(keyedAnswer(find('11010110₂ expressed in decimal'))).toBe('214₁₀');
  });

  it('2AF in hexadecimal is 687 in decimal', () => {
    expect(parseInt('2AF', 16)).toBe(687);
    expect(keyedAnswer(find('2AF₁₆ expressed in decimal'))).toBe('687₁₀');
  });

  it('110110 in binary is 66 in octal', () => {
    expect(parseInt('110110', 2).toString(8)).toBe('66');
    expect(keyedAnswer(find('110110₂ expressed in octal'))).toBe('66₈');
  });

  it('3D in hexadecimal is 00111101 in binary', () => {
    expect(parseInt('3D', 16).toString(2).padStart(8, '0')).toBe('00111101');
    expect(keyedAnswer(find('3D₁₆ expressed in binary'))).toBe('00111101₂');
  });

  it('every distractor in a conversion question is genuinely wrong', () => {
    const conversions: Array<[string, number]> = [
      ['45₁₀ expressed in binary', 45],
      ['11010110₂ expressed in decimal', 214],
      ['2AF₁₆ expressed in decimal', 687],
      ['110110₂ expressed in octal', 54],
      ['3D₁₆ expressed in binary', 61],
    ];

    for (const [fragment, trueValue] of conversions) {
      const q = find(fragment);
      q.options.forEach((opt, i) => {
        // Strip the subscript base marker and parse in the stated base.
        const m = /^([0-9A-F]+)([₂₈₁₆₀]+)/.exec(opt);
        if (!m) return;
        const base = opt.includes('₁₆') ? 16 : opt.includes('₈') ? 8 : opt.includes('₂') ? 2 : 10;
        const value = parseInt(m[1]!, base);
        if (i === q.correct) expect(value).toBe(trueValue);
        else expect(value, `${fragment} option ${i} should be wrong`).not.toBe(trueValue);
      });
    }
  });
});

describe('other computable answers', () => {
  it('1 GB really is 1024 × 1024 KB', () => {
    expect(1024 * 1024).toBe(1_048_576);
    expect(keyedAnswer(find('kilobytes are there in 1 gigabyte'))).toBe('1024 × 1024 KB');
  });

  it('AVERAGE of 10,20,30,40,50 is 30', () => {
    const values = [10, 20, 30, 40, 50];
    expect(values.reduce((a, b) => a + b, 0) / values.length).toBe(30);
    expect(keyedAnswer(find('=AVERAGE(A1:A5)'))).toBe('30');
  });

  it('COUNT ignores text and empty cells', () => {
    const range: (number | string | null)[] = [5, 'absent', 12, null, 8];
    expect(range.filter((v) => typeof v === 'number').length).toBe(3);
    expect(keyedAnswer(find('`COUNT` of that range'))).toBe('3');
  });

  it('NOR(1,0) is 0', () => {
    const nor = (a: number, b: number) => (a || b ? 0 : 1);
    expect(nor(1, 0)).toBe(0);
    expect(keyedAnswer(find('A = 1 and B = 0'))).toBe('0');
  });

  it('a 4-input truth table has 16 rows', () => {
    expect(2 ** 4).toBe(16);
    expect(keyedAnswer(find('**4** inputs has how many rows'))).toBe('16');
  });

  it('IF(45>=50,"Pass","Fail") gives Fail', () => {
    expect(45 >= 50 ? 'Pass' : 'Fail').toBe('Fail');
    expect(keyedAnswer(find('=IF(B2>=50,"Pass","Fail")'))).toBe('Fail');
  });

  it('copying =B2*$C$1 down one row gives =B3*$C$1', () => {
    expect(keyedAnswer(find('copied down to cell D3'))).toBe('=B3*$C$1');
  });
});

describe('syllabus coverage', () => {
  it('covers every unit of the syllabus', () => {
    const covered = new Set(MODEL_QUESTIONS.map((q) => q.topic.split('.')[0]));
    const allUnits = OL_ICT_SYLLABUS.map((u) => u.code);
    const missing = allUnits.filter((u) => !covered.has(u));
    expect(missing, `units with no seeded questions: ${missing.join(', ')}`).toEqual([]);
  });

  it('covers both grades', () => {
    const unitGrade = new Map(OL_ICT_SYLLABUS.map((u) => [u.code, u.grade]));
    const grades = new Set(
      MODEL_QUESTIONS.map((q) => unitGrade.get(q.topic.split('.')[0]!)),
    );
    expect(grades).toEqual(new Set([10, 11]));
  });
});

/**
 * The 2026 expansion.
 *
 * Everything below covers questions authored against the NIE Grade 10 and 11
 * textbooks, including the first questions in this bank that depend on a
 * figure. Two kinds of claim are checked: the arithmetic, re-derived rather
 * than restated, and the figure references, which are the new way for a
 * question to be broken — a stem that says "the given logic circuit" when no
 * circuit will reach the student is not a question at all.
 */
describe('conversions re-derived from first principles', () => {
  const dec = (s: string, base: number) => parseInt(s, base);

  it('10011011 binary is 155', () => {
    const q = find('**10011011₂**');
    expect(dec('10011011', 2)).toBe(155);
    expect(keyedAnswer(q)).toBe('155');
  });

  it('200 decimal is 11001000 binary', () => {
    const q = find('**200₁₀** in binary');
    expect((200).toString(2)).toBe('11001000');
    expect(keyedAnswer(q)).toBe('11001000₂');
  });

  it('156 decimal is 9C hexadecimal', () => {
    const q = find('**156₁₀** in hexadecimal');
    expect((156).toString(16).toUpperCase()).toBe('9C');
    expect(keyedAnswer(q)).toBe('9C₁₆');
  });

  it('347 octal is 231 decimal', () => {
    const q = find('**347₈** in decimal');
    expect(dec('347', 8)).toBe(231);
    expect(keyedAnswer(q)).toBe('231');
  });

  it('1F hexadecimal is 11111 binary', () => {
    const q = find('**1F₁₆** in binary');
    expect(dec('1F', 16).toString(2)).toBe('11111');
    expect(keyedAnswer(q)).toBe('11111₂');
  });

  it('11011 binary is 33 octal', () => {
    const q = find('**11011₂** in octal');
    expect(dec('11011', 2).toString(8)).toBe('33');
    expect(keyedAnswer(q)).toBe('33₈');
  });

  it('the place-value figure holds 181', () => {
    const q = find('place-value frame');
    expect(dec('10110101', 2)).toBe(181);
    expect(keyedAnswer(q)).toBe('181');
  });

  it('storage units step by 1024, not 1000', () => {
    expect(keyedAnswer(find('capacity of **4 GB**'))).toBe(`${4 * 1024} MB`);
    expect(keyedAnswer(find('3.5 MB'))).toBe(`${3.5 * 1024} KB`);
  });

  it('8 bits give 256 combinations', () => {
    expect(keyedAnswer(find('using **8 bits**'))).toBe(String(2 ** 8));
  });

  it('3 inputs give 8 truth-table rows', () => {
    expect(keyedAnswer(find('with **three** inputs'))).toBe(String(2 ** 3));
  });

  it('ASCII D is 68 when A is 65', () => {
    expect('D'.charCodeAt(0)).toBe(68);
    expect(keyedAnswer(find('ASCII value of the character **D**'))).toBe('68');
  });

  it('B2:D5 spans 12 cells', () => {
    const cols = 'D'.charCodeAt(0) - 'B'.charCodeAt(0) + 1;
    const rows = 5 - 2 + 1;
    expect(cols * rows).toBe(12);
    expect(keyedAnswer(find('**B2:D5**'))).toBe('12');
  });

  it('a 1000 by 800 image has 800 000 pixels', () => {
    expect(1000 * 800).toBe(800_000);
    expect(keyedAnswer(find('1000 pixels wide'))).toBe('800 000');
  });
});

describe('logic answers re-derived from the gate definitions', () => {
  const AND = (a: number, b: number) => (a && b ? 1 : 0);
  const OR = (a: number, b: number) => (a || b ? 1 : 0);
  const NOT = (a: number) => (a ? 0 : 1);

  it('(A.B) + NOT C is 0 for A=1, B=0, C=1', () => {
    expect(OR(AND(1, 0), NOT(1))).toBe(0);
    expect(keyedAnswer(find('when A = 1, B = 0 and C = 1'))).toBe('0');
  });

  it('(A + B).NOT B is 1 only when A=1 and B=0', () => {
    const truthy: string[] = [];
    for (const a of [0, 1]) {
      for (const b of [0, 1]) {
        if (AND(OR(a, b), NOT(b))) truthy.push(`A = ${a}, B = ${b}`);
      }
    }
    expect(truthy).toEqual(['A = 1, B = 0']);
    expect(keyedAnswer(find('produce **Q = 1**'))).toBe('A = 1, B = 0');
  });

  it('NOT of NAND is AND, for every input pair', () => {
    for (const a of [0, 1]) {
      for (const b of [0, 1]) {
        expect(NOT(NOT(AND(a, b)))).toBe(AND(a, b));
      }
    }
    expect(keyedAnswer(find('through a NAND gate and then through a NOT gate'))).toBe(
      'AND gate',
    );
  });

  it('the seeded truth table really is NAND', () => {
    const rows = [
      [0, 0, 1],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ];
    for (const [a, b, q] of rows) expect(NOT(AND(a!, b!))).toBe(q);
    expect(keyedAnswer(find('truth table shown'))).toBe('NAND gate');
  });
});

describe('traced algorithms', () => {
  /** The flowchart the figure draws, executed rather than described. */
  const sumToN = (n: number) => {
    let s = 0;
    let i = 1;
    while (!(i > n)) {
      s = s + i;
      i = i + 1;
    }
    return s;
  };

  it('the flowchart outputs 10 for N = 4', () => {
    expect(sumToN(4)).toBe(10);
    expect(keyedAnswer(find('when the input **N** is 4'))).toBe('10');
  });

  it('the FOR loop pseudocode displays 15', () => {
    let total = 0;
    for (let i = 1; i <= 5; i++) total += i;
    expect(total).toBe(15);
    expect(keyedAnswer(find('FOR I = 1 TO 5'))).toBe('15');
  });
});

describe('figure questions', () => {
  const withFigure = MODEL_QUESTIONS.filter((q) => q.figure);

  it('exist at all — a bank with no picture questions mistrains for this paper', () => {
    expect(withFigure.length).toBeGreaterThanOrEqual(15);
  });

  it('names a figure that has actually been drawn', async () => {
    const { figureBySlug } = await import('./model-figures');
    for (const q of withFigure) {
      expect(figureBySlug(q.figure!), `${q.figure} in "${q.stem.slice(0, 40)}"`).toBeDefined();
    }
  });

  /*
   * The accessibility contract. A student using a screen reader gets the alt
   * text in place of the picture, so if the alt text is thin the question is
   * simply unanswerable for them — and unlike the extracted past-paper figures,
   * these were drawn by us, so there is no excuse for a placeholder.
   */
  it('gives every figure real alt text, never a placeholder', async () => {
    const { MODEL_FIGURES } = await import('./model-figures');
    for (const f of MODEL_FIGURES) {
      expect(f.alt.length, f.slug).toBeGreaterThan(80);
      expect(f.alt, f.slug).not.toMatch(/not yet described|placeholder|TODO/i);
    }
  });

  /*
   * Alt text describes the figure; it must not hand over the answer. A
   * description saying "the output is 0" would make the question trivial for
   * exactly the students the description exists to serve.
   */
  it('does not leak the answer into the alt text', async () => {
    const { figureBySlug } = await import('./model-figures');
    for (const q of withFigure) {
      const alt = figureBySlug(q.figure!)!.alt.toLowerCase();
      const answer = q.options[q.correct].toLowerCase();
      // Short answers like "0" or "10" legitimately appear inside a described
      // table, so only full-phrase answers are checked.
      if (answer.length < 12) continue;
      expect(alt, `${q.figure} leaks "${answer}"`).not.toContain(answer);
    }
  });

  it('says in the stem that there is something to look at', () => {
    for (const q of withFigure) {
      expect(q.stem, q.stem.slice(0, 50)).toMatch(/given|shown|diagram|figure|frame/i);
    }
  });
});

describe('coverage after the 2026 expansion', () => {
  it('reaches every topic in the syllabus', () => {
    const covered = new Set(MODEL_QUESTIONS.map((q) => q.topic));
    for (const unit of OL_ICT_SYLLABUS) {
      for (const topic of unit.topics) {
        expect(covered.has(topic.code), `${topic.code} ${topic.title}`).toBe(true);
      }
    }
  });

  it('weights the heavily examined units more than one question each', () => {
    const count = (code: string) =>
      MODEL_QUESTIONS.filter((q) => q.topic === code).length;
    // Number conversion, logic gates and algorithms dominate real Paper I.
    expect(count('3.3')).toBeGreaterThanOrEqual(8);
    expect(count('4.1')).toBeGreaterThanOrEqual(7);
    expect(count('10.3')).toBeGreaterThanOrEqual(4);
  });
});
