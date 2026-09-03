import { describe, it, expect } from 'vitest';

import { BLEEPS, bleepForAnswer, type BleepName } from './bleeps';
import { isSoundOn } from './preference';

/**
 * The sounds make a claim to a student in a way they cannot inspect: they
 * cannot see that "wrong" is the same length as "right", they can only feel it.
 * So the promises the file makes in prose are asserted here, where a future
 * change that makes the wrong answer sound longer, lower or funnier fails.
 */

const duration = (name: BleepName) =>
  BLEEPS[name].reduce((total, [, ms]) => total + ms, 0);

describe('what the bleeps are allowed to be', () => {
  it('gives a wrong answer exactly the same airtime as a right one', () => {
    expect(duration('wrong')).toBe(duration('right'));
  });

  it('does not turn a wrong answer into a joke or a lament', () => {
    // One note. A fall from one pitch to a lower one is the sad-trombone
    // shape, and this product does not make fun of a fifteen-year-old.
    expect(BLEEPS.wrong).toHaveLength(1);
  });

  it('keeps every sound short enough to sit under the next tap', () => {
    for (const name of Object.keys(BLEEPS) as BleepName[]) {
      expect(duration(name), name).toBeLessThanOrEqual(300);
    }
  });

  it('makes the tick on selection the quietest thing in the set', () => {
    for (const name of Object.keys(BLEEPS) as BleepName[]) {
      if (name === 'select') continue;
      expect(duration('select')).toBeLessThan(duration(name));
    }
  });

  it('adds exactly one note for a streak rather than a fanfare', () => {
    expect(BLEEPS.streak).toHaveLength(BLEEPS.right.length + 1);
    // And it opens on the same figure, so it reads as "that again, plus".
    expect(BLEEPS.streak[0]?.[0]).toBe(BLEEPS.right[0]?.[0]);
  });

  it('stays in a range a phone speaker can actually produce', () => {
    for (const [name, notes] of Object.entries(BLEEPS)) {
      for (const [hz] of notes) {
        expect(hz, name).toBeGreaterThanOrEqual(200);
        expect(hz, name).toBeLessThanOrEqual(4000);
      }
    }
  });
});

describe('which bleep an answer earns', () => {
  it('is wrong whatever the run was', () => {
    expect(bleepForAnswer(false, 1)).toBe('wrong');
    expect(bleepForAnswer(false, 9)).toBe('wrong');
  });

  it('only reaches for the streak note at three in a row', () => {
    expect(bleepForAnswer(true, 1)).toBe('right');
    expect(bleepForAnswer(true, 2)).toBe('right');
    expect(bleepForAnswer(true, 3)).toBe('streak');
  });

  /* The same threshold BIT uses on screen. If these ever drift, a student
     hears a streak while the companion is still showing "2 in a row". */
  it('agrees with the threshold BIT displays', async () => {
    const { moodFor } = await import('@/lib/domain/companion');
    for (const length of [1, 2, 3, 4]) {
      const run = { correct: true, length, started: true, open: false };
      const heard = bleepForAnswer(true, length) === 'streak';
      const seen = moodFor(run) === 'streak';
      expect(heard, `run of ${length}`).toBe(seen);
    }
  });
});

describe('the default', () => {
  it('is silence', () => {
    // No window, no localStorage, nothing chosen — and still off.
    expect(isSoundOn()).toBe(false);
  });
});
