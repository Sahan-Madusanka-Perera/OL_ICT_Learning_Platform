import { cn } from '@/lib/utils/cn';

/**
 * The icon family, drawn as pixels.
 *
 * A 1.6-stroke round-capped icon set is the wrong object in this world: it
 * has curves and half-pixels, and it would sit next to Silkscreen looking
 * like something pasted in from another system. So every icon here is built
 * from whole cells on a 12×12 grid and rendered only at whole multiples of
 * that grid (12, 24, 36) with `crispEdges`, which means no icon in this
 * product ever has an anti-aliased edge.
 *
 * Rules:
 *   - 12×12 grid, filled rects only, no strokes, no curves
 *   - `currentColor`, so an icon inverts with whatever it sits on
 *   - decorative by default; pass `title` when the icon is the only label
 */

type IconProps = {
  /** Whole multiples of the 12-cell grid. */
  size?: 12 | 24 | 36;
  className?: string;
  /** Supply only when the icon carries meaning no adjacent text carries. */
  title?: string;
};

/** [x, y, width, height] in grid cells. */
type Cell = readonly [number, number, number, number];

function Pixels({
  size = 12,
  className,
  title,
  cells,
}: IconProps & { cells: readonly Cell[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      fill="currentColor"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {cells.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}

/* ---------- verdict ---------- */

/** Correct. Always accompanied by the word — never the mark alone. */
export function CheckIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[
        [1, 5, 2, 2], [2, 6, 2, 2], [3, 7, 2, 2],
        [4, 6, 2, 2], [5, 5, 2, 2], [6, 4, 2, 2], [7, 3, 2, 2], [8, 2, 2, 2],
      ]}
    />
  );
}

/** Wrong — the ╳, drawn as two pixel diagonals. */
export function CrossIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[
        [1, 1, 2, 2], [2, 2, 2, 2], [3, 3, 2, 2], [4, 4, 2, 2],
        [5, 5, 2, 2], [6, 6, 2, 2], [7, 7, 2, 2], [8, 8, 2, 2],
        [8, 1, 2, 2], [7, 2, 2, 2], [6, 3, 2, 2], [5, 4, 2, 2],
        [3, 6, 2, 2], [2, 7, 2, 2], [1, 8, 2, 2],
      ]}
    />
  );
}

/** Not attempted — an empty cell, which is exactly what it is. */
export function RingIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[[1, 1, 10, 2], [1, 9, 10, 2], [1, 1, 2, 10], [9, 1, 2, 10]]}
    />
  );
}

export function AlertIcon(props: IconProps) {
  return <Pixels {...props} cells={[[5, 1, 2, 7], [5, 9, 2, 2]]} />;
}

/* ---------- direction ---------- */

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[[3, 5, 8, 2], [1, 5, 2, 2], [3, 3, 2, 2], [3, 7, 2, 2], [5, 1, 2, 2], [5, 9, 2, 2]]}
    />
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[[1, 5, 8, 2], [9, 5, 2, 2], [7, 3, 2, 2], [7, 7, 2, 2], [5, 1, 2, 2], [5, 9, 2, 2]]}
    />
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[[4, 1, 2, 2], [6, 3, 2, 2], [8, 5, 2, 2], [6, 7, 2, 2], [4, 9, 2, 2]]}
    />
  );
}

/* ---------- trend ---------- */

export function TrendUpIcon(props: IconProps) {
  return (
    <Pixels {...props} cells={[[1, 8, 2, 2], [3, 6, 2, 2], [5, 4, 2, 2], [7, 2, 2, 2], [9, 2, 2, 2], [9, 4, 2, 2]]} />
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <Pixels {...props} cells={[[1, 2, 2, 2], [3, 4, 2, 2], [5, 6, 2, 2], [7, 8, 2, 2], [9, 8, 2, 2], [9, 6, 2, 2]]} />
  );
}

export function TrendFlatIcon(props: IconProps) {
  return <Pixels {...props} cells={[[1, 5, 10, 2]]} />;
}

/* ---------- product ---------- */

/**
 * The streak mark.
 *
 * A flame is the category default and reads as a game congratulating a
 * child. This is a stack of days — which is literally what the number counts.
 */
export function StreakIcon(props: IconProps) {
  return (
    <Pixels {...props} cells={[[1, 7, 2, 4], [4, 4, 2, 7], [7, 6, 2, 5], [10, 2, 2, 9]]} />
  );
}

/** Marks a question flagged to come back to. A filled cell — set, not unset. */
export function FlagPinIcon(props: IconProps) {
  return <Pixels {...props} cells={[[4, 4, 4, 4]]} />;
}

/**
 * The save mark.
 *
 * One silhouette, not a filled/outline pair: at 12 cells an outlined tag and
 * a filled one differ by four pixels, which is not a distinction a tired
 * student reads on a bus. Saved state inverts the control instead, which is
 * this world's own way of saying a thing is set.
 */
export function BookmarkIcon(props: IconProps) {
  return <Pixels {...props} cells={[[2, 1, 8, 8], [2, 9, 2, 2], [8, 9, 2, 2]]} />;
}

export function ClockIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[[1, 1, 10, 2], [1, 9, 10, 2], [1, 1, 2, 10], [9, 1, 2, 10], [5, 3, 2, 3], [5, 5, 3, 2]]}
    />
  );
}

/* ---------- navigation ---------- */

export function HomeIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[
        [5, 1, 2, 2], [3, 3, 2, 2], [7, 3, 2, 2], [1, 5, 10, 2],
        [2, 7, 2, 4], [8, 7, 2, 4], [2, 9, 3, 2], [7, 9, 3, 2],
      ]}
    />
  );
}

export function PlayIcon(props: IconProps) {
  return <Pixels {...props} cells={[[3, 2, 2, 8], [5, 3, 2, 6], [7, 5, 2, 2]]} />;
}

export function FlagIcon(props: IconProps) {
  return <Pixels {...props} cells={[[2, 1, 2, 10], [4, 1, 6, 5]]} />;
}

export function ChartIcon(props: IconProps) {
  return <Pixels {...props} cells={[[1, 8, 2, 3], [4, 5, 2, 6], [7, 6, 2, 5], [10, 3, 2, 8]]} />;
}

/* ---------- sound ----------
   A cone and two arcs, and the muted twin is the same cone with the arcs
   replaced by a cross. Distinguishing them by presence-of-arcs alone would put
   the whole state on two small cells; the cross reads at 24px on a phone. */

export function SoundOnIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[
        [1, 4, 2, 4], [3, 3, 2, 6], [5, 1, 2, 10],
        [8, 5, 1, 2], [10, 3, 1, 6],
      ]}
    />
  );
}

export function SoundOffIcon(props: IconProps) {
  return (
    <Pixels
      {...props}
      cells={[
        [1, 4, 2, 4], [3, 3, 2, 6], [5, 1, 2, 10],
        // A 3x3 X sharing its centre cell. Two 4x4 diagonals miss each other
        // on this grid and the result reads as a snowflake, not a cross.
        [8, 4, 1, 1], [10, 4, 1, 1], [9, 5, 1, 1], [8, 6, 1, 1], [10, 6, 1, 1],
      ]}
    />
  );
}
