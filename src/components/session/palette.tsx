'use client';

import { useEffect, useRef } from 'react';
import type { StudentQuestion } from '@/lib/services/questions';
import { cn } from '@/lib/utils/cn';

/**
 * The question palette.
 *
 * Standard in a real examination-hall interface, and the fastest way to see
 * what is left. One scrolling row rather than a wrapped grid, so it stays a
 * fixed 48px of the action bar however long the paper is — a palette that
 * grows to four rows on a phone eats the question it was meant to serve.
 *
 * Every cell is legible as a bit: set, unset, or marked.
 *
 * Cells are full 56px targets, which puts two of this component's jobs in
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
    <nav aria-label="Jump to question" className="border-t border-ink">
      <ul className="mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-3 py-2 sm:flex-wrap sm:overflow-x-visible sm:px-4">
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
                  'font-pixel ant-focus relative flex h-14 w-14 shrink-0 items-center justify-center',
                  'border border-ink text-[16px] leading-none',
                  isCurrent && 'ants border-2',
                  correct === true && 'bg-ink text-paper',
                  correct === false && 'dither-25',
                  correct === null && answered && 'bg-ink text-paper',
                  !answered && 'bg-paper',
                )}
              >
                {i + 1}
                {answer?.markedForReview ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-0.5 top-0.5 h-1.5 w-1.5 bg-current"
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
