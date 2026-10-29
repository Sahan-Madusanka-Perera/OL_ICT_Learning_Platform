import { cn } from '@/lib/utils/cn';

/**
 * Every surface is a sheet of milk glass.
 *
 * Translucent white over the fixed wash, a lit rim along its edge and a long,
 * violet-tinted shadow — so it reads as frosted without a backdrop filter on
 * anything that scrolls. The corner is 28px on a desktop and 24 on a phone,
 * where a bigger curve would eat into a 360px column.
 *
 * The header is a title with its note set underneath it, the way a printed
 * figure carries its caption — not a bordered strip across the top. A count
 * rides beside the title as a small pill, so "Saved 4" reads as one phrase.
 *
 * `tone`: `default` glass, `raised` for the one opaque sheet that is the
 * subject of its screen, `quiet` for a recessive pane, and the four pastels
 * for a sheet that is itself the reference's course card. A pastel goes on the
 * sheet, never on a panel inside a white sheet — one surface, not two.
 */
export function Window({
  title,
  note,
  count,
  action,
  tone = 'default',
  className,
  bodyClassName,
  headerClassName,
  children,
  as: Tag = 'section',
}: {
  /** The card's heading. Omit for a chromeless pane. */
  title?: React.ReactNode;
  /** One line under the title — timings, provenance, what the card is for. */
  note?: React.ReactNode;
  /** A quantity set beside the title as a pill. */
  count?: number;
  /** A control on the right of the header. */
  action?: React.ReactNode;
  tone?: 'default' | 'raised' | 'quiet' | 'lilac' | 'sky' | 'mint' | 'peach';
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  children: React.ReactNode;
  as?: 'section' | 'div' | 'article' | 'li' | 'aside';
}) {
  const tinted = tone === 'lilac' || tone === 'sky' || tone === 'mint' || tone === 'peach';

  return (
    <Tag
      /*
       * `flex` + `h-full` so a card fills its grid row; two sheets side by
       * side end on the same line instead of at their own content height.
       */
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[24px] sm:rounded-xl',
        tone === 'default' && 'glass',
        tone === 'raised' && 'glass-raised',
        tone === 'quiet' && 'bg-surface/50 shadow-[inset_0_0_0_1px_var(--color-rim)]',
        tinted && 'shadow-[var(--shadow-glass)]',
        tone === 'lilac' && 'tint-lilac',
        tone === 'sky' && 'tint-sky',
        tone === 'mint' && 'tint-mint',
        tone === 'peach' && 'tint-peach',
        className,
      )}
    >
      {title !== undefined ? (
        <header
          className={cn(
            'flex flex-wrap items-start gap-x-3 gap-y-3 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6',
            headerClassName,
          )}
        >
          <div className="min-w-[12rem] flex-1">
            {/*
              The title wraps rather than truncating: a topic name is content,
              and a no-wrap title plus its count was wider than a 280px phone,
              which pushed the whole sheet off the screen.
            */}
            <h2 className="flex items-baseline gap-2.5 text-[20px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[22px]">
              <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
              {count !== undefined ? (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-[1.5] tracking-normal tabular',
                    tinted ? 'bg-raised/60' : 'bg-sunken text-muted',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </h2>
            {note ? (
              <p
                className={cn(
                  'mt-1 text-[13px] leading-snug tabular',
                  tinted ? 'opacity-80' : 'text-muted',
                )}
              >
                {note}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}

      <div
        className={cn(
          'flex-1 px-5 pb-6 sm:px-7 sm:pb-7',
          title === undefined && 'pt-6 sm:pt-7',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

/**
 * A row inside a sheet's flush list. The padding matches the sheet's own, so
 * row text lines up under the title rather than wandering off its edge.
 */
export const ROW = 'px-5 sm:px-7';

/**
 * A rule inside a card. `soft` is a lighter hairline.
 */
export function Rule({ soft, className }: { soft?: boolean; className?: string }) {
  return (
    <hr
      className={cn('border-0 border-t', soft ? 'border-line-soft' : 'border-line', className)}
    />
  );
}

/**
 * The small label — a caption that names a quantity or a field. Sentence
 * case and muted; it never stands above a heading as a kicker.
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
  return <Tag className={cn('eyebrow', className)}>{children}</Tag>;
}

/**
 * A small pill. The system's one badge shape.
 *
 * `tone` never carries meaning on its own — every caller pairs it with an icon
 * and a word, which is the rule the whole product is built on.
 */
export function Pill({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: 'neutral' | 'accent' | 'correct' | 'wrong' | 'caution' | 'brass' | 'glass';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5',
        'text-[12px] font-medium leading-none',
        tone === 'neutral' && 'bg-sunken text-muted',
        tone === 'glass' && 'bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-line-soft)]',
        tone === 'accent' && 'bg-accent text-accent-ink',
        tone === 'correct' && 'bg-correct-soft text-correct',
        tone === 'wrong' && 'bg-wrong-soft text-wrong',
        tone === 'caution' && 'bg-caution-soft text-caution',
        tone === 'brass' && 'bg-brass-soft text-brass',
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The icon tile — a small rounded square holding one glyph. Ink-filled by
 * default, the way the reference marks a list row's kind; a pastel tone when
 * the row belongs to a family.
 */
export function IconTile({
  children,
  tone = 'ink',
  size = 'md',
  className,
}: {
  children: React.ReactNode;
  tone?: 'ink' | 'glass' | 'lilac' | 'sky' | 'mint' | 'peach';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center',
        size === 'md' ? 'h-11 w-11 rounded-tile' : 'h-8 w-8 rounded-[11px]',
        tone === 'ink' && 'bg-accent text-accent-ink',
        tone === 'glass' && 'bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-line-soft)]',
        tone === 'lilac' && 'tint-lilac',
        tone === 'sky' && 'tint-sky',
        tone === 'mint' && 'tint-mint',
        tone === 'peach' && 'tint-peach',
        className,
      )}
    >
      {children}
    </span>
  );
}
