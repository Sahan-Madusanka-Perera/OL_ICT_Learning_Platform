'use client';

import { useState } from 'react';
import type { StudentQuestion } from '@/lib/services/questions';
import type { AnswerOutcome } from '@/lib/services/sessions';
import { SourceBadge } from '@/components/ui/source-badge';
import { Pill } from '@/components/ui/window';
import { StimulusFigure } from '@/components/session/stimulus-figure';
import { cn } from '@/lib/utils/cn';
import { renderInline } from '@/lib/utils/markdown';
import { CheckIcon, CrossIcon, BookmarkIcon } from '@/components/ui/icon';

/**
 * One question and its options.
 *
 * The options are a radiogroup built from real buttons with roving state, so
 * keyboard and screen-reader behaviour is standard.
 *
 * Every state is carried three ways — never by colour alone:
 *
 *   selected   ink outline, ink number disc
 *   correct    green ground, a tick, and the word "Correct"
 *   your mark  red ground, a cross, and the words "Your answer"
 *   inert      faded to muted, outline dropped to a hairline
 *
 * That is not belt-and-braces. Roughly one student in twelve cannot separate
 * the green from the red, and this is the exact screen where being wrong about
 * that costs them the explanation.
 *
 * The number disc stays a disc at every state. A control that changes shape as
 * well as colour reads as a different control, and the student has to re-find
 * which row they were on.
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
    <article className="glass-raised overflow-hidden rounded-[24px] sm:rounded-xl">
      {/* ---- provenance ---- */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-8 sm:pt-7">
        <SourceBadge source={question.source} />
        <Pill tone="neutral" className="capitalize">
          {question.difficulty}
        </Pill>

        {onBookmark ? (
          <button
            type="button"
            onClick={() => {
              setBookmarked((b) => !b);
              onBookmark();
            }}
            aria-pressed={bookmarked}
            className={cn(
              'ml-auto flex h-11 w-11 items-center justify-center rounded-full',
              'transition-[background-color,color,transform] duration-200 ease-[var(--ease-settle)]',
              'active:scale-95',
              bookmarked
                ? 'bg-accent text-accent-ink'
                : 'bg-sunken text-muted hover:text-ink',
            )}
          >
            <BookmarkIcon size={20} />
            <span className="sr-only-live">
              {bookmarked ? 'Remove bookmark' : 'Save this question'}
            </span>
          </button>
        ) : null}
      </div>

      <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
        {/* ---- shared stimulus ---- */}
        {question.stimulus ? (
          <StimulusFigure stimulus={question.stimulus} className="mb-6" />
        ) : null}

        {/* ---- the question ---- */}
        <h1
          className="prose-tight text-question font-sans font-normal tracking-[-0.01em]"
          dangerouslySetInnerHTML={{ __html: renderInline(question.stem) }}
        />

        {/* ---- options ---- */}
        <div role="radiogroup" aria-label="Answer options" className="mt-7 flex flex-col gap-2.5">
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
                  'group flex min-h-16 w-full items-center gap-4 rounded-[20px] p-3 pr-4 text-left',
                  'transition-[background-color,box-shadow,transform,opacity] duration-200',
                  'ease-[var(--ease-settle)] disabled:cursor-default',
                  !locked && 'active:scale-[0.995]',
                  showAsRight &&
                    'bg-correct-soft shadow-[inset_0_0_0_1.5px_var(--color-correct)]',
                  showAsWrong && 'bg-wrong-soft shadow-[inset_0_0_0_1.5px_var(--color-wrong)]',
                  inert && 'opacity-55 shadow-[inset_0_0_0_1px_var(--color-line-soft)]',
                  !locked &&
                    isSelected &&
                    'bg-accent-soft shadow-[inset_0_0_0_1.5px_var(--color-accent)]',
                  !locked &&
                    !isSelected &&
                    'bg-raised shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-sunken',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]',
                    'text-[15px] font-medium leading-none',
                    'transition-colors duration-200 ease-[var(--ease-settle)]',
                    showAsRight && 'bg-correct text-raised',
                    showAsWrong && 'bg-wrong text-raised',
                    inert && 'bg-sunken text-muted',
                    !locked && isSelected && 'bg-accent text-accent-ink',
                    !locked && !isSelected && 'bg-sunken text-muted',
                  )}
                >
                  {showAsRight ? (
                    <CheckIcon size={16} />
                  ) : showAsWrong ? (
                    <CrossIcon size={16} />
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  {option.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={option.imageUrl}
                      alt={option.imageAlt ?? ''}
                      className="max-h-28 rounded-sm bg-[#fff] p-1"
                    />
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
                  <span
                    className={cn(
                      'shrink-0 text-[13px] font-medium',
                      showAsRight ? 'text-correct' : 'text-wrong',
                    )}
                  >
                    {showAsRight ? 'Correct' : 'Your answer'}
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
          <p className="mt-6 hidden items-center gap-1.5 text-[13px] text-muted sm:flex">
            <Key>1</Key>–<Key>{String(question.options.length)}</Key>
            <span>to choose</span>
            <span className="px-1 opacity-50">·</span>
            <Key>Enter</Key>
            <span>to confirm</span>
          </p>
        )}
      </div>
    </article>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[22px] items-center justify-center rounded-[7px] px-1.5 py-0.5',
        'bg-raised font-mono text-[12px] not-italic text-ink',
        'shadow-[inset_0_0_0_1px_var(--color-line),0_1px_0_0_var(--color-line)]',
      )}
    >
      {children}
    </kbd>
  );
}
