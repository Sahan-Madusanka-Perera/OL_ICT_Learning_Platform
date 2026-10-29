import { cn } from '@/lib/utils/cn';
import { type BitMood, type BitRun, moodFor, labelFor } from '@/lib/domain/companion';

export type { BitMood, BitRun };
export { moodFor, labelFor, runFromAnswers } from '@/lib/domain/companion';

/**
 * BIT — the session's status readout.
 *
 * WHY A CHARACTER IS ALLOWED HERE AT ALL
 * --------------------------------------
 * A mascot that simply smiles at the student would be decoration, and this
 * product does not get to spend screen on decoration.
 *
 * So BIT is not decoration, it is a readout. Its face reports the student's
 * current **run** — how many they have got right, or wrong, in a row this
 * session — which is the one fact about their performance that appears nowhere
 * else on screen. The progress bar counts answered questions; the numeral
 * counts position; neither says "you have four in a row". BIT does, and that is
 * the whole of its job. There is no state it can be in that is not derived from
 * an answer the student actually gave — see `lib/domain/companion.ts`, where
 * that half lives and is tested.
 *
 * WHAT IT WILL NOT DO
 * -------------------
 * It does not celebrate. `FeedbackPanel` already argues this: a bounce at the
 * verdict would read as a game congratulating a child, and half the time the
 * verdict is "not quite". So BIT never appears *because* an answer was right —
 * it is present the whole time, the way a status light is, and only its
 * expression moves.
 *
 * It also never carries a verdict alone. The word is always beside it.
 *
 * DRAWING RULES
 * -------------
 * The same 20-unit viewBox, 1.25 stroke and round joins as `icon.tsx`, so BIT
 * belongs to the icon family rather than visiting from another system. It is a
 * small screen on a stand: a rounded rect, two eyes, a mouth. The face is the
 * only part that changes between moods — the chassis never moves, which is
 * what keeps it reading as an instrument rather than an animation.
 */

/** The chassis. Identical in every mood, which is most of why this works. */
function Chassis() {
  return (
    <>
      <rect x="2.5" y="3" width="15" height="11" rx="2.5" />
      <path d="M10 14v2.2" />
      <path d="M6.5 17.2h7" />
    </>
  );
}

/**
 * Eyes and mouth per mood, drawn inside the screen (y 5 to 12).
 *
 * Every mouth is a stroke rather than a filled shape, so none of them can read
 * as a grin. The range runs from "tight line" to "shallow curve" and stops
 * there — the happiest BIT gets is a slightly wider curve, because the student
 * it is reporting to may be about to get the next one wrong.
 */
const FACE: Record<BitMood, React.ReactNode> = {
  // Nothing answered yet. Open, level, waiting.
  ready: (
    <>
      <path d="M7 7.5v1.6" />
      <path d="M13 7.5v1.6" />
      <path d="M7.8 11.3h4.4" />
    </>
  ),
  // A question is open. Eyes narrow to a considering squint.
  waiting: (
    <>
      <path d="M6.3 8.3h1.5" />
      <path d="M12.2 8.3h1.5" />
      <path d="M8.6 11.3h2.8" />
    </>
  ),
  // One or two right in a row. The mouth lifts; the eyes do not change.
  right: (
    <>
      <path d="M7 7.5v1.6" />
      <path d="M13 7.5v1.6" />
      <path d="M7.5 10.9c.9.9 4.1.9 5 0" />
    </>
  ),
  // Three or more. The curve widens by a little. This is as loud as it gets.
  streak: (
    <>
      <path d="M6.8 7.3v1.9" />
      <path d="M13.2 7.3v1.9" />
      <path d="M6.9 10.6c1.2 1.4 5 1.4 6.2 0" />
    </>
  ),
  // A wrong answer. Attentive rather than sad: the mouth tightens and stays
  // level. It does not turn down. One miss is not a verdict on the student.
  miss: (
    <>
      <path d="M7 7.5v1.6" />
      <path d="M13 7.5v1.6" />
      <path d="M8.8 11.3h2.4" />
    </>
  ),
  // Three or more wrong. Concerned, and the label does the actual talking.
  wobble: (
    <>
      <path d="M7 7.5v1.6" />
      <path d="M13 7.5v1.6" />
      <path d="M7.5 11.6c.9-.9 4.1-.9 5 0" />
    </>
  ),
};

/** Shut eyes for the blink — one short horizontal stroke where each eye sits. */
const BLINK = (
  <>
    <path d="M6.3 8.5h1.5" />
    <path d="M12.2 8.5h1.5" />
  </>
);

/**
 * The sprite alone, without its word. Decorative on its own, so it is
 * `aria-hidden` and every caller ships the label beside it — a verdict never
 * travels on a mark alone in this system.
 */
export function BitSprite({
  mood,
  size = 32,
  className,
}: {
  mood: BitMood;
  size?: 16 | 20 | 24 | 32 | 48;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={size >= 40 ? 1 : 1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('bit shrink-0', className)}
    >
      <Chassis />
      {/*
       * Open face and shut face are both drawn and the blink swaps which is
       * visible. Toggling two static groups beats animating geometry: nothing
       * is interpolated, so the stroke never lands on a half pixel mid-blink.
       */}
      <g className="bit-open">{FACE[mood]}</g>
      <g className="bit-shut">
        {BLINK}
        {MOUTH_ONLY[mood]}
      </g>
    </svg>
  );
}

/**
 * The mouth without the eyes, for the blink frame.
 *
 * Kept as its own table rather than sliced out of `FACE` at runtime. The old
 * version relied on "the first two children are always the eyes", which is the
 * kind of invariant that holds until someone adds an eyebrow.
 */
const MOUTH_ONLY: Record<BitMood, React.ReactNode> = {
  ready: <path d="M7.8 11.3h4.4" />,
  waiting: <path d="M8.6 11.3h2.8" />,
  right: <path d="M7.5 10.9c.9.9 4.1.9 5 0" />,
  streak: <path d="M6.9 10.6c1.2 1.4 5 1.4 6.2 0" />,
  miss: <path d="M8.8 11.3h2.4" />,
  wobble: <path d="M7.5 11.6c.9-.9 4.1-.9 5 0" />,
};

/** Sprite and word together. This is what callers mount. */
export function Bit({
  run,
  size = 32,
  className,
}: {
  run: BitRun;
  size?: 16 | 20 | 24 | 32 | 48;
  className?: string;
}) {
  return (
    <p className={cn('flex items-center gap-2 text-muted', className)}>
      <BitSprite mood={moodFor(run)} size={size} />
      <span className="truncate text-[13px] font-medium">{labelFor(run)}</span>
    </p>
  );
}
