import { cn } from '@/lib/utils/cn';

/**
 * Quantity primitives.
 *
 * These carry the product's one non-negotiable rule — never show a student a
 * number the evidence has not earned — so the shapes here are designed around
 * a distinction most progress bars cannot make: *not measured* has to look
 * different from *measured at zero*. A bar drawn at 0% says the second when it
 * means the first, and that is the single most likely way this product could
 * mislead someone about how ready they are.
 */

/**
 * A meter.
 *
 * Three readable layers: a sunken track, a filled span, and — when the reading
 * is still an early estimate — a hatched tail standing for the range the
 * evidence has not narrowed yet. The hatch is the honest part. A solid bar at
 * 67% after three questions claims a precision the posterior does not have;
 * the tail shows the same reading with its uncertainty attached.
 */
export function BitStrip({
  filled,
  total,
  className,
  label,
  size = 'md',
  soft,
  tone = 'accent',
}: {
  filled: number;
  total: number;
  /** When absent the meter is decorative and the value is stated in text. */
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  /** An early estimate: draw the uncertainty, do not hide it. */
  soft?: boolean;
  tone?: 'accent' | 'correct' | 'caution' | 'ink';
}) {
  const pct = total > 0 ? Math.max(0, Math.min(1, filled / total)) * 100 : 0;

  /* Gradient fills from the pastel ramps: mint into sky for plain progress,
     into teal for strength, apricot for what needs work. The printed value
     beside every meter carries the reading; the tone is the second signal. */
  const fill = {
    accent: 'meter-fill',
    correct: 'meter-high',
    caution: 'meter-low',
    ink: 'bg-accent',
  }[tone];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-sunken',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-[var(--ease-settle)]',
          'motion-reduce:transition-none',
          fill,
          soft && 'opacity-70',
        )}
        style={{ width: `${pct}%` }}
      />
      {soft ? (
        /*
         * The uncertainty tail. Starts where the estimate ends and runs to the
         * right edge, drawn as a fine diagonal hatch so it reads as "somewhere
         * in here" rather than as more bar.
         */
        <div
          className="absolute inset-y-0 right-0 opacity-45"
          style={{
            width: `${100 - pct}%`,
            backgroundImage:
              'repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 5px)',
            color: 'var(--color-faint)',
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * A meter with no measurement behind it.
 *
 * Deliberately not an empty meter. A dashed outline with nothing inside says
 * "we have not measured this"; an empty track says "we measured this and it is
 * zero". Those are different sentences and a student deserves the right one.
 */
export function UnmeasuredStrip({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        'h-2 w-full rounded-full border border-dashed border-faint/60',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/**
 * A quantity, set in a reserved width.
 *
 * The box is as wide as `slots` digits whether or not they are all used, and
 * the figure sits flush right inside it, so a count of 7 and a count of 148
 * put their last digit in the same place down a column of cards. Numbers stop
 * floating inside their boxes and become a register you can read across.
 *
 * The glyphs themselves are set naturally rather than one per cell: Lexend's
 * figures are proportional, and a "1" centred in a full-width cell left a hole
 * in "15" big enough to read as two numbers.
 *
 * Set light at display sizes — the reference's "57%" and "10,568" — so a large
 * figure reads as one calm shape from arm's length.
 */
export function Numeral({
  value,
  slots = 2,
  className,
  size = 'md',
}: {
  value: number | string;
  /**
   * Reserved digit positions, so figures stacked in a column end on the same
   * vertical. `0` reserves nothing — for a figure that stands alone and should
   * sit tight against the word beside it.
   */
  slots?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const text = String(value);

  const sizeClass = {
    sm: 'text-[15px] font-medium',
    md: 'text-[28px]',
    lg: 'text-[42px]',
    xl: 'text-[42px] sm:text-[56px]',
  }[size];

  /* Small sizes stay in the interface weight; display sizes go light. */
  const face = size === 'sm' ? 'font-sans' : 'display-xl';

  return (
    <span
      className={cn('inline-block text-right leading-none tabular', face, sizeClass, className)}
      style={slots > 0 ? { minWidth: `${Math.max(slots, text.length) * 0.58}em` } : undefined}
    >
      {text}
    </span>
  );
}
