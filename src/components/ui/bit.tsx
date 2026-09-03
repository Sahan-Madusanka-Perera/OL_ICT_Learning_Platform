import { cn } from '@/lib/utils/cn';
import { type BitMood, type BitRun, moodFor, labelFor } from '@/lib/domain/companion';

export type { BitMood, BitRun };
export { moodFor, labelFor, runFromAnswers } from '@/lib/domain/companion';

/**
 * BIT — the one-bit companion.
 *
 * WHY A CHARACTER IS ALLOWED HERE AT ALL
 * --------------------------------------
 * The design system's own rule is "if a pixel is not carrying information, it
 * is not in the design", and it names decorative pixel art as the thing not to
 * add. A mascot that simply smiles at the student would break that outright.
 *
 * So BIT is not decoration, it is a readout. Its face reports the student's
 * current **run** — how many they have got right, or wrong, in a row this
 * session — which is the one fact about their performance that appears nowhere
 * else on screen. The progress strip counts answered questions; the numeral
 * counts position; neither says "you have four in a row". BIT does, and that is
 * the whole of its job. There is no state it can be in that is not derived from
 * an answer the student actually gave — see `lib/domain/companion.ts`, where
 * that half lives and is tested.
 *
 * WHAT IT WILL NOT DO
 * -------------------
 * It does not celebrate. `FeedbackPanel` already argues this: an overshoot or a
 * bounce at the verdict "would read as a game congratulating a child", and half
 * the time the verdict is "not quite". So BIT never appears *because* an answer
 * was right — it is present the whole time, the way a status light is, and only
 * its expression moves.
 *
 * DRAWING RULES
 * -------------
 * Same discipline as `icon.tsx`: filled cells only, `currentColor`, no strokes,
 * no curves, `crispEdges`, rendered at whole multiples of its grid. The grid is
 * 16 rather than the icon set's 12 because a face needs eyes, a mouth and a
 * body, and those do not land on whole cells at 12.
 *
 * It is never inverted. The viewport's one inversion belongs to the live thing,
 * and a status readout is not the live thing.
 */

/** [x, y, width, height] in grid cells, on the 16×16 field. */
type Cell = readonly [number, number, number, number];

/* The chassis: a little CRT. Unit 3 of the syllabus is two-state data, and the
   product's whole conceit is a one-bit desktop, so the companion is a screen. */
const FRAME: readonly Cell[] = [
  [2, 1, 12, 1], // top
  [2, 9, 12, 1], // bottom
  [2, 2, 1, 7], // left
  [13, 2, 1, 7], // right
  [7, 10, 2, 1], // neck
  [5, 11, 6, 1], // base
];

/**
 * Eyes and mouth per mood. The first two cells of every entry are the eyes —
 * `BitSprite` relies on that when it swaps in the shut pair for a blink.
 */
const FACE: Record<BitMood, readonly Cell[]> = {
  /* The screen's interior is rows 2-8. Eyes live on 3-4 and mouths on 6-7,
     which keeps a clear row above and below both: a mouth on row 8 touches the
     bottom frame and reads as the face melting into the stand. */

  // Nothing answered yet. Open, level, waiting.
  ready: [
    [5, 3, 2, 2],
    [9, 3, 2, 2],
    [6, 6, 4, 1],
  ],
  // A question is open. Eyes narrow to a considering squint.
  waiting: [
    [5, 4, 2, 1],
    [9, 4, 2, 1],
    [7, 6, 2, 1],
  ],
  // One or two right in a row.
  right: [
    [5, 3, 2, 2],
    [9, 3, 2, 2],
    [5, 6, 1, 1],
    [6, 7, 4, 1],
    [10, 6, 1, 1],
  ],
  // Three or more. Eyes widen by a cell each and the smile runs the full face —
  // the only "louder" this character gets. Widening rather than heightening is
  // forced: row 2 is the last clear row, so a taller eye touches the top frame
  // and the face reads as broken rather than pleased.
  streak: [
    [4, 3, 3, 2],
    [9, 3, 3, 2],
    [4, 6, 1, 1],
    [5, 7, 6, 1],
    [11, 6, 1, 1],
  ],
  // A wrong answer. Attentive rather than sad: the mouth tightens, it does
  // not turn down. One miss is not a verdict on the student.
  miss: [
    [5, 3, 2, 2],
    [9, 3, 2, 2],
    [7, 6, 2, 1],
    [7, 7, 2, 1],
  ],
  // Three or more wrong. Concerned, and the label does the actual talking.
  wobble: [
    [5, 3, 2, 2],
    [9, 3, 2, 2],
    [5, 7, 1, 1],
    [6, 6, 4, 1],
    [10, 7, 1, 1],
  ],
};

/** Shut eyes for the blink — one closed cell where each eye sits. */
const BLINK: readonly Cell[] = [
  [5, 4, 2, 1],
  [9, 4, 2, 1],
];

function Cells({ cells }: { cells: readonly Cell[] }) {
  return (
    <>
      {cells.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h} fill="currentColor" />
      ))}
    </>
  );
}

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
  /** Whole multiples of the 16-cell grid. */
  size?: 16 | 32 | 48;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={cn('bit shrink-0', className)}
    >
      <Cells cells={FRAME} />
      {/* Open face and shut face are both drawn and the blink swaps which is
          visible. Toggling two static groups beats animating geometry: the
          shapes stay on whole cells at every frame, the way everything in this
          system does. */}
      <g className="bit-open">
        <Cells cells={FACE[mood]} />
      </g>
      <g className="bit-shut">
        <Cells cells={BLINK} />
        <Cells cells={FACE[mood].slice(2)} />
      </g>
    </svg>
  );
}

/** Sprite and word together. This is what callers mount. */
export function Bit({
  run,
  size = 32,
  className,
}: {
  run: BitRun;
  size?: 16 | 32 | 48;
  className?: string;
}) {
  return (
    <p className={cn('flex items-center gap-2 text-ink', className)}>
      <BitSprite mood={moodFor(run)} size={size} />
      <span className="font-pixel truncate text-[16px] uppercase leading-none">
        {labelFor(run)}
      </span>
    </p>
  );
}
