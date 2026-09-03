/**
 * BIT's state — what the one-bit companion is allowed to say.
 *
 * This lives in `lib/domain` with the rest of the pure logic because it is the
 * half of the character that can be wrong. The sprite is drawing; this is the
 * claim it makes about the student, and a claim wants tests.
 *
 * The rule the whole file exists to hold: BIT reports the student's current
 * **run** — how many right, or wrong, in a row this session — and nothing else.
 * A run is a fact. It is not an estimate of mastery, it is not praise, and it
 * is not available at all in an exam, where the platform withholds correctness
 * until submit and BIT must therefore stay neutral rather than invent a mood.
 *
 * See `components/ui/bit.tsx` for why a character is permitted in a design
 * system that bans decorative pixel art at all.
 */

export type BitMood = 'ready' | 'waiting' | 'right' | 'streak' | 'miss' | 'wobble';

/**
 * The run BIT is reporting.
 *
 * `correct: null` means the session withholds correctness — an exam — and BIT
 * has nothing it is allowed to say.
 */
export type BitRun = {
  correct: boolean | null;
  length: number;
  /** True once the student has answered at least one question this session. */
  started: boolean;
  /** True while a question is open and unanswered. */
  open: boolean;
};

export function moodFor(run: BitRun): BitMood {
  if (!run.started || run.correct === null) return run.open ? 'waiting' : 'ready';
  if (run.open) return 'waiting';
  if (run.correct) return run.length >= 3 ? 'streak' : 'right';
  return run.length >= 3 ? 'wobble' : 'miss';
}

/**
 * The word.
 *
 * Facts only — a count of what happened, never a judgement of the student.
 * "Slow down" is the one piece of advice it gives, and it gives it at the point
 * where a student is most likely to be guessing rather than reading.
 */

/**
 * The word.
 *
 * Facts only — a count of what happened, never a judgement of the student.
 * "Slow down" is the one piece of advice it gives, and it gives it at the point
 * where a student is most likely to be guessing rather than reading.
 */
export function labelFor(run: BitRun): string {
  const mood = moodFor(run);
  switch (mood) {
    case 'ready':
      return 'Ready';
    case 'waiting':
      return 'Take your time';
    case 'right':
      return run.length >= 2 ? `${run.length} in a row` : 'That one’s right';
    case 'streak':
      return `${run.length} in a row`;
    case 'miss':
      return 'Missed that one';
    case 'wobble':
      return `${run.length} missed — slow down`;
  }
}

/**
 * Sprite and word together. This is what callers mount.
 *
 * Never inverted: the viewport's one inversion belongs to the live thing, and
 * a status readout is not the live thing.
 */

/**
 * The trailing run of same-verdict answers, in the order the questions were
 * served. Answers the student has not given break the run; so does an exam,
 * which reports `isCorrect: null`.
 */
export function runFromAnswers(
  orderedQuestionIds: readonly string[],
  answers: Record<string, { selectedOptionIds: string[]; isCorrect: boolean | null }>,
  open: boolean,
): BitRun {
  const verdicts: (boolean | null)[] = [];
  for (const id of orderedQuestionIds) {
    const a = answers[id];
    if (!a || a.selectedOptionIds.length === 0) continue;
    verdicts.push(a.isCorrect);
  }

  const started = verdicts.length > 0;
  const last = verdicts.at(-1);
  if (last === undefined || last === null) {
    return { correct: last === undefined ? null : null, length: 0, started, open };
  }

  let length = 0;
  for (let i = verdicts.length - 1; i >= 0; i--) {
    if (verdicts[i] !== last) break;
    length++;
  }
  return { correct: last, length, started, open };
}
