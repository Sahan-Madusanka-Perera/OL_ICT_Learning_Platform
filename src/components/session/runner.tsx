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
      {/* ---- title bar: one floating island, the session's own chrome ---- */}
      <header ref={barRef} className="sticky top-0 z-10">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[115%] backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
        />
        <div className="relative mx-auto max-w-3xl px-3 pt-3 sm:px-5">
          <div className="island flex h-14 items-center gap-3 rounded-full pl-2 pr-3 sm:pr-4">
            <button
              type="button"
              onClick={() => setConfirmSubmit(true)}
              className="h-10 shrink-0 rounded-full bg-sunken px-4 text-[13px] font-medium text-ink transition-colors duration-200 hover:bg-accent hover:text-accent-ink"
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
              <BitStrip filled={answeredCount} total={total} />
            </div>

            <p className="flex shrink-0 items-baseline text-[14px] text-muted tabular">
              <span className="font-medium text-ink">{index + 1}</span>
              <span aria-hidden="true">&thinsp;/&thinsp;{total}</span>
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
            quite". Under the title bar it is a status light instead: always
            present, never triggered, and the only thing that moves is its face.

            It is dropped entirely in an exam. Correctness is withheld until
            submit, so there is no run to report and a companion that cannot
            speak is just decoration taking up 40px.
          */}
          {session.revealAnswers ? (
            <div className="flex h-12 items-center gap-2 px-3">
              <Bit run={run} size={32} />
              {/* Beside BIT because they are the same feature to a student:
                  the companion, and whether it is allowed to make a noise. */}
              <SoundToggle className="ml-auto" />
            </div>
          ) : (
            <div className="h-3" />
          )}
        </div>
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
      {/*
        The bottom padding clears the sticky action bar and the palette beneath
        it. Without it the last option of every question sits permanently under
        the bar — readable only by scrolling past the end of the page, which
        there is nothing below to allow.
      */}
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-3 pb-52 pt-2 sm:px-5 sm:pt-3">
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
            className="mt-4 flex items-start gap-2.5 rounded-tile bg-wrong-soft px-4 py-3.5 text-[15px] font-medium text-wrong shadow-[inset_0_0_0_1px_var(--color-wrong)]"
          >
            {error}
          </p>
        ) : null}

        {outcome?.feedback ? (
          <div ref={feedbackRef} className="mt-5 scroll-mt-20">
            <FeedbackPanel outcome={outcome} question={question} />
          </div>
        ) : null}
      </main>

      {/* ---- action bar: a floating island holding the controls and the palette ---- */}
      {/* Same column as the question card above, so the two edges line up. */}
      <div className="sticky bottom-0 mx-auto w-full max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-5">
        <div className="island overflow-hidden rounded-[28px]">
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous question"
          >
            <ArrowLeftIcon size={20} />
          </Button>

          {outcome ? (
            /*
             * Still the primary. Once an answer is locked, advancing IS the
             * live action on the screen — the options are inert and the
             * explanation is read-only — so the accent follows it rather than
             * leaving the student to hunt for what to do next.
             */
            <Button size="lg" full onClick={advance}>
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
            <ArrowRightIcon size={20} />
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/50 p-3 backdrop-blur-md sm:items-center">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        className="glass-raised reveal w-full max-w-sm overflow-hidden rounded-xl"
      >
        <div className="px-6 pt-6">
          <h2 id="submit-title" className="text-[22px] leading-tight tracking-[-0.025em]">
            Finish this session?
          </h2>
        </div>

        <div className="px-6 pb-6 pt-4">
          {unanswered > 0 ? (
            <div className="tint-peach flex items-start gap-4 rounded-[20px] p-4">
              <div className="shrink-0 text-center">
                <Numeral value={unanswered} slots={2} size="lg" />
                <p className="mt-1 text-[13px] opacity-80">Unanswered</p>
              </div>
              <p className="flex-1 text-[15px] leading-relaxed opacity-90">
                They will be marked as not attempted, and each one goes into your mistake
                book for review.
              </p>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed text-muted">
              You have answered every question.
            </p>
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
