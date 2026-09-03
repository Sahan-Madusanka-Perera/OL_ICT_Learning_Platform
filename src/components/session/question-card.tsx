'use client';

import { useState } from 'react';
import type { StudentQuestion } from '@/lib/services/questions';
import type { AnswerOutcome } from '@/lib/services/sessions';
import { SourceBadge } from '@/components/ui/source-badge';
import { Label } from '@/components/ui/window';
import { cn } from '@/lib/utils/cn';
import { renderInline } from '@/lib/utils/markdown';
import { CheckIcon, CrossIcon, BookmarkIcon } from '@/components/ui/icon';

/**
 * One question and its options.
 *
 * The options are a radiogroup built from real buttons with roving state, so
 * keyboard and screen-reader behaviour is standard.
 *
 * State is carried by pattern and form, which in a world with no colour is
 * not a discipline — it is the only option available:
 *
 *   selected  marching ants, running
 *   correct   full inversion, checkmark, and the word CORRECT
 *   your mark ╳, a 25% dither ground, and the words YOUR MARK
 *   inert     chrome dropped to a dashed line
 *
 * The inversion on a correct option is the viewport's one inversion, which
 * is why the action bar's control goes quiet the moment an answer lands.
 */
export function QuestionCard({
  question,
  selected,
  onSelect,
  locked,
  outcome,
  onBookmark,
}: {
  question: StudentQuestion;
  selected: string[];
  onSelect: (ids: string[]) => void;
  locked: boolean;
  outcome: AnswerOutcome | null;
  onBookmark?: () => void;
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const correctIds = outcome?.feedback?.correctOptionIds ?? [];

  return (
    <article className="border-y border-ink bg-paper sm:border-x">
      {/* ---- provenance bar ---- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink px-3 py-2 sm:px-4">
        <SourceBadge source={question.source} />
        <span className="font-pixel border border-ink px-2 py-1 text-[16px] uppercase leading-none">
          {question.difficulty}
        </span>

        {onBookmark ? (
          <button
            type="button"
            onClick={() => {
              setBookmarked((b) => !b);
              onBookmark();
            }}
            aria-pressed={bookmarked}
            className={cn(
              'ant-focus ml-auto flex h-14 w-14 items-center justify-center border border-ink',
              bookmarked ? 'bg-ink text-paper' : 'bg-paper hover:bg-ink hover:text-paper',
            )}
          >
            <BookmarkIcon size={24} />
            <span className="sr-only-live">
              {bookmarked ? 'Remove bookmark' : 'Save this question'}
            </span>
          </button>
        ) : null}
      </div>

      <div className="px-3 py-4 sm:px-4">
        {/* ---- shared stimulus ---- */}
        {question.stimulus ? (
          <figure className="mb-5 border-y border-ink py-3">
            {question.stimulus.caption ? (
              <Label as="p" className="mb-2">
                {question.stimulus.caption}
              </Label>
            ) : null}
            {question.stimulus.imageUrl ? (
              /*
               * The asset's own alt text, never the caption. A caption is
               * printed beside the figure and a screen reader already reads
               * it, so reusing it as alt says the same words twice and still
               * never describes the picture — and for these questions the
               * picture is the question. Past-paper figures are seeded with an
               * explicit "not yet described" placeholder, which is why nothing
               * carrying one can be published.
               */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={question.stimulus.imageUrl}
                alt={question.stimulus.imageAlt ?? ''}
                className="max-w-full"
              />
            ) : null}
            {question.stimulus.content ? (
              <div
                className="text-[15px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderInline(question.stimulus.content) }}
              />
            ) : null}
          </figure>
        ) : null}

        {/* ---- the question ---- */}
        <h1
          className="text-question"
          dangerouslySetInnerHTML={{ __html: renderInline(question.stem) }}
        />

        {/* ---- options ---- */}
        <div role="radiogroup" aria-label="Answer options" className="mt-5 flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isSelected = selected.includes(option.id);
            const isCorrect = correctIds.includes(option.id);
            const showAsRight = locked && isCorrect;
            const showAsWrong = locked && isSelected && !isCorrect;
            const inert = locked && !showAsRight && !showAsWrong;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={locked}
                onClick={() => onSelect([option.id])}
                className={cn(
                  'ant-focus flex min-h-[--spacing-touch] w-full items-stretch border text-left',
                  'disabled:cursor-default',
                  showAsRight && 'border-ink bg-ink text-paper',
                  showAsWrong && 'dither-25 border-2 border-ink',
                  inert && 'border-dashed border-ink bg-paper',
                  !locked && isSelected && 'ants border-2 border-ink bg-paper',
                  !locked && !isSelected && 'border-ink bg-paper',
                )}
              >
                <span
                  aria-hidden="true"
                  className="font-pixel flex w-12 shrink-0 items-center justify-center border-r border-current text-[16px] leading-none"
                >
                  {showAsRight ? (
                    <CheckIcon size={12} />
                  ) : showAsWrong ? (
                    <CrossIcon size={12} />
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="min-w-0 flex-1 px-3 py-3">
                  {option.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={option.imageUrl} alt={option.imageAlt ?? ''} className="max-h-24" />
                  ) : null}
                  {option.content ? (
                    <span
                      className="block text-option"
                      dangerouslySetInnerHTML={{ __html: renderInline(option.content) }}
                    />
                  ) : null}
                </span>

                {/* The word, always — the mark alone never carries the verdict. */}
                {showAsRight || showAsWrong ? (
                  <span className="font-pixel flex shrink-0 items-center px-3 text-[16px] uppercase leading-none">
                    {showAsRight ? 'Correct' : 'Your mark'}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/*
          The hint describes controls that stop working once the answer is
          locked, and it sits between the options and the explanation —
          exactly where a student's eye travels next. It goes away on answer.
        */}
        {locked ? null : (
          <p className="font-pixel mt-4 hidden text-[16px] uppercase leading-none sm:block">
            <Key>1</Key>–<Key>{String(question.options.length)}</Key> to choose ·{' '}
            <Key>Enter</Key> to confirm
          </p>
        )}
      </div>
    </article>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-ink px-1 not-italic">{children}</kbd>;
}
