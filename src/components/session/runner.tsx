'use client';

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from 'react';
import type { SessionView, AnswerOutcome } from '@/lib/services/sessions';
import {
  submitAnswerAction,
  submitSessionAction,
  toggleBookmarkAction,
} from '@/lib/actions/practice';
import { QuestionCard } from './question-card';
import { FeedbackPanel } from './feedback-panel';
import { QuestionPalette } from './palette';
import { ExamTimer } from './timer';
import { Button } from '@/components/ui/button';
import { BitStrip, Numeral } from '@/components/ui/bits';
import { Bit, runFromAnswers } from '@/components/ui/bit';
import { SoundToggle, useSound } from '@/components/ui/sound-toggle';
import { bleepForAnswer } from '@/lib/sound/bleeps';
import { Label } from '@/components/ui/window';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icon';

/**
 * The practice/exam runner.
 *
 * Design decisions worth keeping:
 *  - One question fills the screen on a phone. No sidebar, no chrome.
 *  - Every answer is sent to the server as soon as it is made, so closing
 *    the tab or losing signal costs nothing.
 *  - In practice mode, feedback appears immediately and the student cannot
 *    move on without at least seeing it. In exam mode nothing is revealed.
 *  - Keyboard: 1-4 select, Enter confirms/advances, arrows navigate.
 *
 * The inversion ration is spent here on the primary control while a question
 * is open, and handed to the correct option the moment an answer lands —
 * which is exactly when the correct option becomes the live thing.
 */
export function SessionRunner({ session }: { session: SessionView }) {
  const [index, setIndex] = useState(() => firstUnanswered(session));
  const [answers, setAnswers] = useState(session.answers);
  const [selected, setSelected] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { bleep } = useSound();
  const questionStartedAt = useRef(Date.now());
  const feedbackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);

  const question = session.questions[index];
  const total = session.questions.length;
  const isLast = index === total - 1;
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionIds.length > 0,
  ).length;

  /* BIT reports the trailing run of same-verdict answers — the one fact about
     how the student is doing that nothing else on this screen shows. In an
     exam `isCorrect` comes back null and the run is empty, so it stays quiet
     rather than inventing a mood. */
  /* Memoised because `confirm` depends on it and `confirm` is a dependency of
     the keyboard effect — a fresh object each render would tear down and
     re-add the window listener on every keystroke. */
  const run = useMemo(
    () => runFromAnswers(session.questions.map((q) => q.id), answers, outcome === null),
    [session.questions, answers, outcome],
  );

  // Reset per-question state whenever the question changes.
  useEffect(() => {
    if (!question) return;
    setSelected(answers[question.id]?.selectedOptionIds ?? []);
    setOutcome(null);
    setError(null);
    questionStartedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Bring the explanation into view once it appears.
   *
   * Without this the feedback lands below the fold — worst on a phone, where
   * a student who answered wrong sees only the marked option and has to work
   * out that there is more below. The explanation is the point of the
   * product; it should not need hunting for.
   */
  useEffect(() => {
    if (!outcome?.feedback) return;
    const el = feedbackRef.current;
    if (!el) return;

    // Two things bite here, and both are why the obvious version fails:
    //
    //  1. scrollIntoView({ block: 'nearest' }) treats a panel barely peeking
    //     above the sticky action bar as already visible, and does nothing.
    //  2. The effect runs before the browser has laid out the now-taller
    //     page, so the scroll target gets clamped to the old scroll height.
    //
    // So: measure and scroll after the next paint, and position explicitly.
    // The offset is measured rather than guessed — the chrome above this bar
    // differs between breakpoints, and a wrong constant parks the panel
    // underneath it, which is the exact failure this effect exists to fix.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const stickyBottom = barRef.current?.getBoundingClientRect().bottom ?? 132;
        const target = el.getBoundingClientRect().top + window.scrollY - stickyBottom - 12;
        window.scrollTo({
          top: Math.max(0, target),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [outcome]);

  const goTo = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(total - 1, next))),
    [total],
  );

  const confirm = useCallback(() => {
    if (!question || selected.length === 0 || pending) return;

    startTransition(async () => {
      try {
        const result = await submitAnswerAction({
          sessionId: session.id,
          questionId: question.id,
          optionIds: selected,
          timeSpentMs: Date.now() - questionStartedAt.current,
        });

        setAnswers((prev) => ({
          ...prev,
          [question.id]: {
            selectedOptionIds: selected,
            markedForReview: prev[question.id]?.markedForReview ?? false,
            isCorrect: session.revealAnswers ? result.isCorrect : null,
          },
        }));

        if (session.revealAnswers) {
          setOutcome(result);
          /* The run in state has not caught up yet — it is recomputed on the
             next render — so the length is taken forward by one here. A streak
             note must land on the answer that made the streak, not the one
             after it. */
          const continuing = run.correct === result.isCorrect;
          bleep(bleepForAnswer(result.isCorrect, continuing ? run.length + 1 : 1));
        } else if (!isLast) {
          goTo(index + 1);
        }
      } catch {
        setError('We could not save that answer. Check your connection and try again.');
      }
    });
  }, [question, selected, pending, session.id, session.revealAnswers, isLast, index, goTo, bleep, run]);

  const advance = useCallback(() => {
    if (isLast) setConfirmSubmit(true);
    else goTo(index + 1);
  }, [isLast, index, goTo]);

  /* ---- keyboard ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName))
        return;
      if (!question) return;

      const n = Number(e.key);
      if (n >= 1 && n <= question.options.length && !outcome) {
        e.preventDefault();
        const option = question.options[n - 1];
        if (option) setSelected([option.id]);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (outcome) advance();
        else confirm();
      }
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, outcome, confirm, advance, goTo, index]);

  if (!question) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---- title bar: this session is the window, the viewport is its frame ---- */}
      <header ref={barRef} className="sticky top-0 z-10 border-b border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setConfirmSubmit(true)}
            className="ant-focus font-pixel h-14 shrink-0 border border-ink px-3 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
          >
            Finish
          </button>

          <div
            className="min-w-0 flex-1"
            role="progressbar"
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${answeredCount} of ${total} answered`}
          >
            <BitStrip filled={answeredCount} total={total} size="sm" />
          </div>

          <p className="font-pixel flex shrink-0 items-baseline text-[16px] leading-none">
            <Numeral value={index + 1} slots={String(total).length} size="sm" />
            <span aria-hidden="true">/{total}</span>
          </p>

          {session.secondsRemaining !== null ? (
            <ExamTimer
              initialSeconds={session.secondsRemaining}
              onExpire={() =>
                startTransition(async () => {
                  await submitSessionAction(session.id);
                })
              }
            />
          ) : null}
        </div>

        {/*
          BIT sits in the chrome, not beside the verdict.

          Putting a face next to "Correct" would make it a reaction, and the
          feedback panel argues at length against anything there that reads as
          a game congratulating a child — half the time the verdict is "not
          quite". As part of the title bar it is a status light instead: always
          present, never triggered, and the only thing that moves is its face.

          It is dropped entirely in an exam. Correctness is withheld until
          submit, so there is no run to report and a companion that cannot
          speak is just decoration taking up 40px.
        */}
        {session.revealAnswers ? (
          <div className="border-t border-ink">
            <div className="mx-auto flex h-10 max-w-3xl items-center gap-2 px-3 sm:px-4">
              <Bit run={run} size={32} />
              {/* Beside BIT because they are the same feature to a student:
                  the companion, and whether it is allowed to make a noise. */}
              <SoundToggle className="ml-auto" />
            </div>
          </div>
        ) : null}
      </header>

      {/*
        Persistent live region.

        The feedback panel mounts together with its content, and a live
        region that appears at the same moment as its text is not reliably
        announced. This one is always in the DOM, so the verdict is spoken
        the instant it changes.
      */}
      <div aria-live="polite" aria-atomic="true" className="sr-only-live">
        {outcome
          ? outcome.isCorrect
            ? 'Correct.'
            : `Not quite. ${outcome.feedback?.misconception ?? ''}`
          : ''}
      </div>

      {/* ---- question ---- */}
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-0 py-4 sm:px-4 sm:py-6">
        <QuestionCard
          question={question}
          selected={selected}
          locked={outcome !== null}
          outcome={outcome}
          onSelect={(ids) => {
            setSelected(ids);
            bleep('select');
          }}
          onBookmark={() => toggleBookmarkAction(question.id)}
        />

        {error ? (
          <p
            role="alert"
            className="dither-25 mt-4 border-y-2 border-ink px-3 py-3 text-[15px] font-semibold sm:border-x-2 sm:px-4"
          >
            {error}
          </p>
        ) : null}

        {outcome?.feedback ? (
          <div ref={feedbackRef} className="mt-4 scroll-mt-20">
            <FeedbackPanel outcome={outcome} question={question} />
          </div>
        ) : null}
      </main>

      {/* ---- action bar ---- */}
      <div className="sticky bottom-0 border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous question"
          >
            <ArrowLeftIcon size={24} />
          </Button>

          {outcome ? (
            /* The inversion has moved to the correct option, so the control
               that advances carries its weight in chrome instead. */
            <Button size="lg" variant="secondary" full onClick={advance} className="border-2">
              {isLast ? 'Finish and see results' : 'Next question'}
            </Button>
          ) : (
            <Button
              size="lg"
              full
              onClick={confirm}
              disabled={selected.length === 0 || pending}
            >
              {pending ? 'Saving…' : session.revealAnswers ? 'Check answer' : 'Save and continue'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="icon"
            onClick={() => goTo(index + 1)}
            disabled={isLast}
            aria-label="Next question"
          >
            <ArrowRightIcon size={24} />
          </Button>
        </div>

        <QuestionPalette
          questions={session.questions}
          answers={answers}
          current={index}
          onJump={goTo}
          revealAnswers={session.revealAnswers}
        />
      </div>

      {/* ---- submit confirmation ---- */}
      {confirmSubmit ? (
        <SubmitDialog
          total={total}
          answered={answeredCount}
          onCancel={() => setConfirmSubmit(false)}
          onConfirm={() =>
            startTransition(async () => {
              await submitSessionAction(session.id);
            })
          }
          pending={pending}
        />
      ) : null}
    </div>
  );
}

function firstUnanswered(session: SessionView): number {
  const i = session.questions.findIndex(
    (q) => (session.answers[q.id]?.selectedOptionIds.length ?? 0) === 0,
  );
  return i === -1 ? 0 : i;
}

/**
 * The one modal in the product, and it earns the interruption: finishing is
 * irreversible and it is reached from a control the student may have hit by
 * accident.
 */
function SubmitDialog({
  total,
  answered,
  onCancel,
  onConfirm,
  pending,
}: {
  total: number;
  answered: number;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const unanswered = total - answered;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="dither-50 fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        className="w-full max-w-sm border border-ink bg-paper"
      >
        <div className="border-b border-ink px-4 py-2">
          <Label as="h2">
            <span id="submit-title">Finish this session?</span>
          </Label>
        </div>

        <div className="px-4 py-4">
          {unanswered > 0 ? (
            <div className="flex items-start gap-4">
              <div className="shrink-0 text-center">
                <Numeral value={unanswered} slots={2} size="lg" />
                <Label className="mt-1.5">Unanswered</Label>
              </div>
              <p className="flex-1 text-[15px] leading-relaxed">
                They will be marked as not attempted, and each one goes into your mistake
                book for review.
              </p>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed">You have answered every question.</p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <Button size="lg" full onClick={onConfirm} disabled={pending}>
              {pending ? 'Marking…' : 'Finish and see results'}
            </Button>
            <Button size="lg" variant="secondary" full onClick={onCancel} disabled={pending}>
              Keep going
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
