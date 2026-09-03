import { cn } from '@/lib/utils/cn';

/**
 * Every surface is a window.
 *
 * 1px black chrome, a title bar in Silkscreen caps, content on solid white —
 * because long-form reading never happens on a dither. On a phone the window
 * goes edge to edge (no side chrome, no gutter), which is both the authentic
 * convention and the one that gives a 360px screen its width back.
 *
 * Title bars are never inverted. DESIGN.md §2 rations inversion to the live
 * thing — the primary action, the current question, the selected option —
 * and a window label is none of those.
 */
export function Window({
  title,
  note,
  action,
  className,
  bodyClassName,
  children,
  as: Tag = 'section',
}: {
  /** Silkscreen caps. Omit for a chromeless pane. */
  title?: React.ReactNode;
  /** Right-aligned in the title bar — counts, timings, provenance. */
  note?: React.ReactNode;
  /** A control in the title bar. */
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  as?: 'section' | 'div' | 'article' | 'li' | 'aside';
}) {
  return (
    <Tag
      className={cn(
        'border-y border-ink bg-paper sm:border-x',
        className,
      )}
    >
      {title !== undefined ? (
        <div
          className="flex min-h-[36px] items-center gap-3 border-b border-ink px-3 py-2 sm:px-4"
        >
          <h2 className="font-pixel min-w-0 flex-1 truncate text-[16px] uppercase leading-none">
            {title}
          </h2>
          {note ? (
            <p className="font-pixel shrink-0 text-[16px] uppercase leading-none">
              {note}
            </p>
          ) : null}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className={cn('px-3 py-4 sm:px-4', bodyClassName)}>{children}</div>
    </Tag>
  );
}

/**
 * A rule inside a window.
 *
 * Solid 1px is structure; dashed 1px is the same line at lower density —
 * which is how this world says "quieter" without reaching for a grey.
 */
export function Rule({ soft, className }: { soft?: boolean; className?: string }) {
  return (
    <hr
      className={cn('border-0 border-t border-ink', soft && 'border-dashed', className)}
    />
  );
}

/**
 * A Silkscreen micro-label. Uppercase, whole-pixel, never below 16px —
 * the bitmap has no legible half-size.
 */
export function Label({
  children,
  className,
  as: Tag = 'p',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'h2' | 'h3' | 'dt' | 'legend';
}) {
  return (
    <Tag className={cn('font-pixel text-[16px] uppercase leading-none', className)}>
      {children}
    </Tag>
  );
}
