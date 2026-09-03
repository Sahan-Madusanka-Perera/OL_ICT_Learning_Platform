/**
 * The one-bit voice.
 *
 * WHY THERE ARE NO AUDIO FILES
 * ----------------------------
 * A square wave is a one-bit waveform — the sample is either up or it is down,
 * which is the same claim the whole interface makes in pixels. So the sounds
 * are synthesised from oscillators rather than shipped as assets. That is not
 * only a conceit: the target device is a mid-range Android on mobile data, and
 * a set of sprites would be tens of kilobytes for something most students will
 * never switch on. This is zero bytes over the network.
 *
 * WHAT THE SOUNDS ARE ALLOWED TO SAY
 * ----------------------------------
 * The same rule the rest of the product runs on: report, do not judge.
 *
 * `right` and `wrong` are the same length and the same loudness, and differ
 * only in pitch. A longer, sadder, or funnier sound for a wrong answer would be
 * the product mocking a fifteen-year-old for getting a question wrong, and a
 * fanfare for a right one would be the celebration `FeedbackPanel` argues
 * against. Neither is a sound this product can make.
 *
 * `streak` is the one exception and it is deliberately small: the same rising
 * figure as `right` with one more note on the end. It plays at three in a row,
 * which is a fact BIT is already reporting on screen.
 *
 * SILENCE IS THE DEFAULT
 * ----------------------
 * This is off until a student turns it on, and that is not a nicety. The stated
 * reader is a tired fifteen-year-old on a bus; a number of them are in a
 * classroom. An app that starts making noise on open is one they get told off
 * for. See `preference.ts` — nothing here is ever called unless the setting is
 * explicitly on.
 */

/** A note: frequency in Hz, and how long to hold it in milliseconds. */
type Note = readonly [hz: number, ms: number];

/**
 * The vocabulary.
 *
 * Pitches are drawn from one pentatonic set so that two sounds landing close
 * together — a tick under a verdict — cannot beat against each other.
 */
export const BLEEPS = {
  /** Choosing an option. Barely there; it fires on every tap. */
  select: [[660, 18]],
  /** A correct answer. Two notes up. */
  right: [
    [880, 55],
    [1320, 70],
  ],
  /**
   * A wrong answer. One note, low — and exactly as long as `right` is, so the
   * two carry the same weight. It is a marker, not a verdict on the student.
   */
  wrong: [[330, 125]],
  /** Three or more in a row. `right`, plus one. */
  streak: [
    [880, 55],
    [1320, 55],
    [1760, 80],
  ],
  /** The session is over. Neutral: it plays whatever the score was. */
  finish: [
    [660, 70],
    [880, 70],
    [1320, 110],
  ],
} as const satisfies Record<string, readonly Note[]>;

export type BleepName = keyof typeof BLEEPS;

/**
 * Peak gain. Low on purpose — this plays over whatever else is happening on a
 * phone, and a square wave at full tilt through a laptop speaker is a shriek.
 */
const PEAK = 0.05;

/** The click-avoidance envelope. A gated square wave pops without one. */
const ATTACK_S = 0.005;
const RELEASE_S = 0.02;

let ctx: AudioContext | null = null;

/**
 * Browsers refuse to start an AudioContext outside a user gesture, so this is
 * called lazily from a real interaction rather than at import.
 */
function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  // Safari and Chrome both park the context; a gesture is what un-parks it.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/**
 * Play one of the bleeps.
 *
 * Callers must have checked the preference first — this does not consult it,
 * so that the "is sound on" decision lives in exactly one place.
 *
 * Silently does nothing where Web Audio is unavailable. A missing sound is
 * never a missing piece of information: every verdict already ships an icon and
 * a word, and the sound is the third copy of something the student can see.
 */
export function play(name: BleepName): void {
  const audio = context();
  if (!audio) return;

  let at = audio.currentTime;
  for (const [hz, ms] of BLEEPS[name]) {
    const seconds = ms / 1000;

    const osc = audio.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(hz, at);

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(PEAK, at + ATTACK_S);
    gain.gain.setValueAtTime(PEAK, at + Math.max(seconds - RELEASE_S, ATTACK_S));
    gain.gain.linearRampToValueAtTime(0, at + seconds);

    osc.connect(gain).connect(audio.destination);
    osc.start(at);
    osc.stop(at + seconds);

    at += seconds;
  }
}

/** Which bleep an answer earns. Kept here so the runner does not decide tone. */
export function bleepForAnswer(isCorrect: boolean, runLength: number): BleepName {
  if (!isCorrect) return 'wrong';
  return runLength >= 3 ? 'streak' : 'right';
}
