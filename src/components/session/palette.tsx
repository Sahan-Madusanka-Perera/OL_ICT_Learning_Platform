'use client';

import { useEffect, useRef } from 'react';
import type { StudentQuestion } from '@/lib/services/questions';
import { cn } from '@/lib/utils/cn';
import { CheckIcon, CrossIcon } from '@/components/ui/icon';

/**
 * The question palette.
 *
 * Standard in a real examination-hall interface, and the fastest way to see
 * what is left. One scrolling row rather than a wrapped grid, so it stays a
 * fixed 48px of the action bar however long the paper is — a palette that
 * grows to four rows on a phone eats the question it was meant to serve.
 *
 * Four states, each distinguishable without colour: unanswered is an outline,
 * answered is filled, correct and incorrect carry their semantic fill plus a
 * tick or a cross, and the current cell carries a ring that sits clear of the
 * cell so it survives on top of any of the other four.
 *
 * Cells are full 48px targets, which puts two of this component's jobs in
 * tension: hitting a cell and seeing the whole paper. They only conflict in
 * a single row, so above `sm` the row wraps and every question is visible at
 * full target size. On a phone it stays one scrolling strip and the current
 * cell is scrolled to centre whenever it changes — at 360px only six cells
 * fit, so from question seven onward the student's own position would
 * otherwise be off-screen, and a palette that cannot show you where you are
 * is worse than no palette.
 */
export function QuestionPalette({
  questions,
  answers,
  current,
  onJump,
  revealAnswers,
}: {
  questions: Array<StudentQuestion & { position: number }>;
  answers: Record<
    string,
    { selectedOptionIds: string[]; markedForReview: boolean; isCorrect: boolean | null }
  >;
  current: number;
  onJump: (index: number) => void;
  revealAnswers: boolean;
}) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [current]);

  return (
    <nav aria-label="Jump to question" className="border-t border-line-soft">
      {/*
        On a phone the strip scrolls; its right edge fades so a cut-off cell
        reads as "more this way" rather than as the end of the paper. The extra
        end padding lets the last cell scroll clear of the fade.
      */}
      <ul className="flex gap-2 overflow-x-auto py-3 pl-3 pr-12 [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)] sm:flex-wrap sm:overflow-x-visible sm:px-4 sm:[mask-image:none]">
        {questions.map((q, i) => {
          const answer = answers[q.id];
          const answered = (answer?.selectedOptionIds.length ?? 0) > 0;
          const correct = revealAnswers ? answer?.isCorrect : null;
          const isCurrent = i === current;

          return (
            <li key={q.id}>
              <button
                ref={isCurrent ? currentRef : undefined}
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={
                  `Question ${i + 1}` +
                  (answered ? ', answered' : ', not answered') +
                  (correct === true ? ', correct' : correct === false ? ', incorrect' : '') +
                  (answer?.markedForReview ? ', marked for review' : '')
                }
                className={cn(
                  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-tile',
                  'text-[14px] font-medium leading-none tabular',
                  'transition-[background-color,color,box-shadow,transform] duration-200',
                  'ease-[var(--ease-settle)] active:scale-95',
                  correct === true && 'bg-correct text-raised',
                  correct === false && 'bg-wrong text-raised',
                  correct === null && answered && 'bg-accent text-accent-ink',
                  !answered &&
                    'bg-raised text-muted shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-ink',
                  /* The ring is drawn outside the cell so it reads on top of
                     every fill above, including the semantic ones. */
                  isCurrent &&
                    'ring-2 ring-focus ring-offset-2 ring-offset-raised',
                )}
              >
                {i + 1}
                {correct === true || correct === false ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-raised',
                      'shadow-[var(--shadow-hairline)]',
                      correct ? 'text-correct' : 'text-wrong',
                    )}
                  >
                    {correct ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
                  </span>
                ) : null}
                {answer?.markedForReview ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-current"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
