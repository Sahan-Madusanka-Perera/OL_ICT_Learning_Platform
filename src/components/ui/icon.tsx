import { cn } from '@/lib/utils/cn';

/**
 * The icon family.
 *
 * One drawing system, used everywhere, rather than a package. That matters
 * more than it sounds: an icon set pulled in wholesale brings its own stroke
 * weight, its own corner radius and its own idea of optical size, and the
 * result sits next to the type looking borrowed.
 *
 * The rules here are fixed and few:
 *
 *   - A 20×20 viewBox. Geometry is drawn on half-integer coordinates so a
 *     1.25 stroke lands on whole pixels at 1× and stays crisp.
 *   - Stroke 1.25, round caps, round joins. Light enough to sit beside
 *     Lexend at 13px without out-weighing it; heavy enough to
 *     survive a mid-range Android panel.
 *   - `currentColor` only. An icon takes the colour of the thing it labels,
 *     which is what lets the same mark work on the accent and on paper.
 *   - Decorative by default. Pass `title` only when the icon is the sole
 *     label, which on a correctness verdict it never is — those always carry
 *     a word as well.
 *
 * Sizes are capped to a small set so icons stay optically consistent: at 24
 * the stroke is scaled down slightly, because a stroke that scales linearly
 * looks heavier as the icon grows.
 */

type IconProps = {
  size?: 12 | 14 | 16 | 20 | 24 | 28 | 36;
  className?: string;
  /** Supply only when the icon carries meaning no adjacent text carries. */
  title?: string;
};

function Glyph({
  size = 20,
  className,
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  /*
   * Optical compensation. A 1.25 stroke on a 20px icon reads the same weight
   * as a 1.1 stroke on a 36px one; keeping it literal makes big icons look
   * bolder than small ones sitting in the same row.
   */
  const stroke = size >= 28 ? 1 : size >= 24 ? 1.15 : 1.25;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* --- verdicts ----------------------------------------------------------- */

export function CheckIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 10.5 8.25 14.25 15.5 6" />
    </Glyph>
  );
}

export function CrossIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
    </Glyph>
  );
}

/** An option that was not chosen and was not the answer. */
export function RingIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="10" cy="10" r="5.25" />
    </Glyph>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.25v4.5" />
      <path d="M10 13.6v.15" />
    </Glyph>
  );
}

/* --- navigation --------------------------------------------------------- */

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M15.5 10H4.5" />
      <path d="M9 4.5 4.5 10 9 15.5" />
    </Glyph>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.5 10h11" />
      <path d="M11 4.5 15.5 10 11 15.5" />
    </Glyph>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M10 15.5v-11" />
      <path d="M4.5 9 10 4.5 15.5 9" />
    </Glyph>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 14 14 6" />
      <path d="M7.5 6H14v6.5" />
    </Glyph>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 4.5 13.5 10 8 15.5" />
    </Glyph>
  );
}

/* --- trend -------------------------------------------------------------- */

export function TrendUpIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 13.5 8 9l3 3 5.5-5.5" />
      <path d="M12.5 6.5h4v4" />
    </Glyph>
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 6.5 8 11l3-3 5.5 5.5" />
      <path d="M12.5 13.5h4v-4" />
    </Glyph>
  );
}

export function TrendFlatIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 10h13" />
    </Glyph>
  );
}

/* --- product ------------------------------------------------------------ */

export function StreakIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M10 2.75c2.4 2.5 3.6 4.5 3.6 6.1 0 1.1-.5 1.9-1.4 2.4.3-1.3-.1-2.5-1.2-3.6.1 2.2-.7 3.6-2.3 4.4" />
      <path d="M10 17.25a4.6 4.6 0 0 1-4.6-4.6c0-2.6 1.9-4.7 4.6-7.9 2.7 3.2 4.6 5.3 4.6 7.9a4.6 4.6 0 0 1-4.6 4.6Z" />
    </Glyph>
  );
}

export function FlagPinIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M10 17.5s5.25-4.3 5.25-8.25a5.25 5.25 0 1 0-10.5 0C4.75 13.2 10 17.5 10 17.5Z" />
      <circle cx="10" cy="9.1" r="1.9" />
    </Glyph>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5.5 3.75h9a.75.75 0 0 1 .75.75v11.75L10 13.25l-5.25 3V4.5a.75.75 0 0 1 .75-.75Z" />
    </Glyph>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 5.75V10l2.75 1.75" />
    </Glyph>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 8.5 10 3.25l6.5 5.25v7.25a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75Z" />
      <path d="M8 16.5v-4.75h4v4.75" />
    </Glyph>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6.75 4.5 15.5 10l-8.75 5.5Z" />
    </Glyph>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 17V3.5" />
      <path d="M5 4.25h8.75l-1.5 3 1.5 3H5" />
    </Glyph>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 16.5h13" />
      <path d="M6.25 16.5v-5" />
      <path d="M10 16.5V6.5" />
      <path d="M13.75 16.5v-7.5" />
    </Glyph>
  );
}

export function SoundOnIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 7.75h2.5L10 4.75v10.5L6.5 12.25H4a.5.5 0 0 1-.5-.5v-3.5a.5.5 0 0 1 .5-.5Z" />
      <path d="M13 7.5a3.5 3.5 0 0 1 0 5" />
      <path d="M15.25 5.5a6.5 6.5 0 0 1 0 9" />
    </Glyph>
  );
}

export function SoundOffIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 7.75h2.5L10 4.75v10.5L6.5 12.25H4a.5.5 0 0 1-.5-.5v-3.5a.5.5 0 0 1 .5-.5Z" />
      <path d="m13.25 8 3.5 4M16.75 8l-3.5 4" />
    </Glyph>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 6.5h7M14.5 6.5h2" />
      <circle cx="12.5" cy="6.5" r="2" />
      <path d="M3.5 13.5h2M9.5 13.5h7" />
      <circle cx="7.5" cy="13.5" r="2" />
    </Glyph>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8.5 16.25H5.25a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1H8.5" />
      <path d="M12.5 6.5 16 10l-3.5 3.5" />
      <path d="M16 10H8" />
    </Glyph>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M10 2.75 15.75 5v4.6c0 3.5-2.4 6.3-5.75 7.65C6.65 15.9 4.25 13.1 4.25 9.6V5Z" />
      <path d="m7.5 10 1.75 1.75L12.75 8.25" />
    </Glyph>
  );
}

/**
 * The product's mark: a chip seen from above. Six pins and a die, drawn in
 * the same line language as everything else, filled only at its core — the
 * subject this is about, at the size of a favicon.
 */
export function ChipMark({ size = 24, className }: { size?: 20 | 24 | 28; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <rect x="4.75" y="4.75" width="10.5" height="10.5" rx="2.5" />
      <rect x="8" y="8" width="4" height="4" rx="0.75" fill="currentColor" stroke="none" />
      <path d="M8 2.5v2.25M12 2.5v2.25M8 15.25v2.25M12 15.25v2.25M2.5 8h2.25M2.5 12h2.25M15.25 8h2.25M15.25 12h2.25" />
    </svg>
  );
}

/* --- provenance --------------------------------------------------------- */

/** An official document: a seal. Marks past-paper and marking-scheme origin. */
export function SealIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="10" cy="8" r="4.75" />
      <path d="M7.5 12.25 6.5 17l3.5-1.75L13.5 17l-1-4.75" />
      <path d="M8.25 8 9.5 9.25 11.75 7" />
    </Glyph>
  );
}

/** Written by us: a pencil. Marks a model question. */
export function PencilIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M13.75 3.75 16.25 6.25 7 15.5l-3.25.75.75-3.25Z" />
      <path d="m12 5.5 2.5 2.5" />
    </Glyph>
  );
}
