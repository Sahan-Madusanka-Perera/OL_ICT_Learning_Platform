import { cn } from '@/lib/utils/cn';

/**
 * A bit strip.
 *
 * In a one-bit world a quantity is not a rounded bar with a gradient — it is
 * a field of cells that are on or off, which is literally the data. Filled
 * cells are solid; unfilled cells are a 25% dither, so the strip is readable
 * as a proportion at a glance and as a count if you look.
 */
export function BitStrip({
  filled,
  total,
  className,
  label,
  size = 'md',
  soft,
}: {
  filled: number;
  total: number;
  /** When absent the strip is decorative and the value is stated in text. */
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  /**
   * Fill at 75% rather than solid — heavy, but short of committed.
   *
   * This is what an early estimate looks like as material: the reading is
   * real enough to draw, not settled enough to state in solid ink. It is the
   * fourth dither density doing the job it was defined for.
   */
  soft?: boolean;
}) {
  const on = Math.max(0, Math.min(total, Math.round(filled)));

  return (
    <div
      className={cn(
        'flex gap-px border border-ink bg-ink',
        size === 'sm' ? 'h-3' : 'h-4',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn('flex-1', i < on ? (soft ? 'dither-75' : 'bg-ink') : 'dither-25')}
        />
      ))}
    </div>
  );
}

/**
 * A strip with no measurement behind it.
 *
 * Deliberately a different pattern from an empty bit strip: 12% dither
 * throughout says "we have not measured this", where 25%-empty cells would
 * say "we measured this and it is zero". The distinction is the whole
 * honesty rule of this product, rendered.
 */
export function UnmeasuredStrip({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('dither-12 h-4 border border-dashed border-ink', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/**
 * A monumental numeral in reserved digit slots.
 *
 * Every slot is a fixed-width cell whether or not it holds a digit, so a
 * count of 7 and a count of 148 put their last digit in the same place down
 * a column of windows. Quantities stop being small numbers floating inside
 * cards and become a register you can read across.
 */
export function Numeral({
  value,
  slots = 2,
  className,
  size = 'md',
}: {
  value: number | string;
  /** Reserved digit positions. Widen for values that will outgrow them. */
  slots?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const text = String(value);
  const cells = text.length >= slots ? [...text] : [...text.padStart(slots, ' ')];

  /* Whole-pixel steps only — the bitmap has no legible half-size. */
  const sizeClass = {
    sm: 'text-[16px]',
    md: 'text-[24px]',
    lg: 'text-[32px]',
    xl: 'text-[48px]',
  }[size];

  return (
    <span className={cn('font-pixel inline-flex leading-none', sizeClass, className)}>
      <span className="sr-only-live">{text}</span>
      {cells.map((ch, i) => (
        <span key={i} aria-hidden="true" className="inline-block w-[0.72em] text-center">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
