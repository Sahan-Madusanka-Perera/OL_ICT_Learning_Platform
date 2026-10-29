import { Label } from '@/components/ui/window';
import { renderInline } from '@/lib/utils/markdown';
import { cn } from '@/lib/utils/cn';
import type { CSSProperties } from 'react';
import type { StudentQuestion } from '@/lib/services/questions';

/** Natural width past which half size is still wider than any phone. */
const WIDE_FIGURE = 800;

/**
 * Shared material a question is asked about: a figure, a code fragment, a
 * passage — or a caption with any of those.
 *
 * One component because the same stimulus is shown in three places — the
 * runner, the results review and the admin review queue — and a reviewer has
 * to approve exactly what a student will see. A Pascal fragment that renders
 * in the runner but not in the review queue gets approved unseen.
 */
export function StimulusFigure({
  stimulus,
  className,
}: {
  stimulus: NonNullable<StudentQuestion['stimulus']>;
  className?: string;
}) {
  return (
    <figure className={cn('overflow-hidden rounded-[20px] bg-sunken p-4 sm:p-5', className)}>
      {stimulus.caption ? (
        <Label as="p" className="mb-3">
          {stimulus.caption}
        </Label>
      ) : null}
      {stimulus.imageUrl ? (
        /*
         * The asset's own alt text, never the caption. A caption is printed
         * beside the figure and a screen reader already reads it, so reusing
         * it as alt says the same words twice and still never describes the
         * picture — and for these questions the picture is the question.
         * Past-paper figures are seeded with an explicit "not yet described"
         * placeholder, which is why nothing carrying one can be published.
         */
        /*
         * Past-paper crops are rendered so half their natural width is about
         * print size. A wide table squeezed onto a phone drops to ~5px text,
         * so on a phone a figure too wide to fit even at half size stops
         * shrinking there and scrolls sideways instead. Narrower figures
         * still fit, rather than hiding a sliver of their edge.
         */
        <div className="overflow-x-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stimulus.imageUrl}
            alt={stimulus.imageAlt ?? ''}
            width={stimulus.imageWidth ?? undefined}
            height={stimulus.imageHeight ?? undefined}
            style={
              stimulus.imageWidth && stimulus.imageWidth > WIDE_FIGURE
                ? ({ '--figure-min': `${Math.round(stimulus.imageWidth / 2)}px` } as CSSProperties)
                : undefined
            }
            className="h-auto max-w-full rounded-sm bg-[#fff] max-sm:min-w-(--figure-min)"
          />
        </div>
      ) : null}
      {stimulus.content ? (
        <div
          className={cn(
            'prose-tight text-[15px] leading-relaxed',
            stimulus.imageUrl && 'mt-3',
            // A code fragment is one listing, not a run of inline snippets:
            // no pill and no padding per segment, or `numbers[C]` reads as
            // `numbers[ C ]`. Lines never wrap; a narrow phone scrolls them.
            stimulus.kind === 'code' &&
              'overflow-x-auto leading-[1.8] [&_code]:bg-transparent [&_code]:p-0 [&_p]:whitespace-nowrap',
          )}
          dangerouslySetInnerHTML={{ __html: renderInline(stimulus.content) }}
        />
      ) : null}
    </figure>
  );
}
