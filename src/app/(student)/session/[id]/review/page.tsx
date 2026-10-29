import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUserPage } from '@/lib/auth/guards';
import { getSessionReview, submitSession } from '@/lib/services/sessions';
import { Window, Pill } from '@/components/ui/window';
import { Button, ButtonAffordance } from '@/components/ui/button';
import { BrandTile } from '@/components/brand';
import { ArrowRightIcon } from '@/components/ui/icon';
import { BitStrip, Numeral } from '@/components/ui/bits';
import { SourceBadge, AnswerConfidenceNote } from '@/components/ui/source-badge';
import { renderInline } from '@/lib/utils/markdown';
import { StimulusFigure } from '@/components/session/stimulus-figure';
import { cn } from '@/lib/utils/cn';
import { CheckIcon, CrossIcon, RingIcon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Results' };

/**
 * The results screen.
 *
 * A score alone teaches nothing, so the score is the smallest part of this
 * page — the topic breakdown and the per-question explanations are the
 * point. But the number that is here gets the monumental treatment, big and
 * light on its own panel, because it is the one thing a student came for and
 * burying it would be its own kind of dishonesty.
 */
export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/session/${id}/review`);

  const review = await getSessionReview(id, user.id);
  if (!review) notFound();

  const result = await submitSession(id, user.id);
  const weakest = [...result.byTopic]
    .filter((t) => t.total > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];

  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-5 px-3 pb-16 pt-4 sm:px-5 sm:pt-6">
      <header className="flex items-center gap-3 px-1">
        <Link href="/dashboard" aria-label="Back to today" className="rounded-tile">
          <BrandTile />
        </Link>
        <span className="text-[15px] font-medium tracking-[-0.02em]">Results</span>
      </header>

      {/* ---- score ---- */}
      <Window tone="lilac" title="Your result" note={resultNote(result.incorrect, result.unanswered)}>
        <div>
          <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Numeral value={result.correct} slots={0} size="xl" />
            <span className="text-[22px] font-light tracking-[-0.025em]">
              of {result.maxScore} correct
            </span>
          </h1>

          <BitStrip
            filled={result.correct}
            total={result.maxScore}
            className="mt-5"
            label={`${result.correct} of ${result.maxScore} correct`}
          />

          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed">
            {verdict(result.percentage)}
          </p>
        </div>

        <p className="mt-5 border-t border-current/15 pt-5 text-[15px] leading-relaxed opacity-85">
          {result.incorrect > 0 ? (
            <>
              The {result.incorrect} {result.incorrect === 1 ? 'question' : 'questions'} you
              missed {result.incorrect === 1 ? 'is' : 'are'} now in your mistake book, and
              will come back for review.
              {weakest && weakest.correct / weakest.total < 0.6
                ? ` ${weakest.title} looks like the one to work on.`
                : ''}
            </>
          ) : (
            'Nothing went into your mistake book from this set.'
          )}
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button asChild size="lg" full>
            <Link href="/dashboard">
              Back to today
              <ButtonAffordance>
                <ArrowRightIcon size={14} />
              </ButtonAffordance>
            </Link>
          </Button>
          {result.incorrect > 0 ? (
            <Button asChild size="lg" variant="secondary" full>
              <Link href="/mistakes">Review my mistakes</Link>
            </Button>
          ) : null}
        </div>
      </Window>

      {/* ---- topic breakdown ---- */}
      {result.byTopic.length > 1 ? (
        <Window title="How it broke down" note="By topic">
          <ul className="flex flex-col gap-5">
            {result.byTopic.map((t) => (
              <li key={t.nodeId}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[15px]">{t.title}</span>
                  <span className="shrink-0 text-[15px] font-medium tabular">
                    {t.correct}
                    <span className="font-normal text-muted">/{t.total}</span>
                  </span>
                </div>
                <BitStrip filled={t.correct} total={t.total} size="sm" className="mt-2" />
              </li>
            ))}
          </ul>
        </Window>
      ) : null}

      {/* ---- every question ---- */}
      <h2 className="section-title mt-6 px-1">Every question</h2>

      <ol className="flex flex-col gap-4">
        {review.items.map((item, i) => {
          const q = item.question;
          if (!q) return null;
          const chosen = item.selectedOptionIds[0];

          return (
            <li key={q.id}>
              <article className="glass overflow-hidden rounded-[24px] sm:rounded-xl">
                <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-7 sm:pt-6">
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-[11px] bg-accent px-2 text-[13px] font-medium text-accent-ink tabular">
                    {i + 1}
                  </span>
                  {item.isCorrect === true ? (
                    <Pill tone="correct">
                      <CheckIcon size={14} />
                      Correct
                    </Pill>
                  ) : item.isCorrect === false ? (
                    <Pill tone="wrong">
                      <CrossIcon size={14} />
                      Wrong
                    </Pill>
                  ) : (
                    <Pill tone="neutral">
                      <RingIcon size={14} />
                      Not attempted
                    </Pill>
                  )}
                  <span className="ml-auto">
                    <SourceBadge source={q.source} />
                  </span>
                </div>

                <div className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7">
                  {/* The figure or code the question is about — reviewing
                      "what is the output?" without the flow-chart is guessing. */}
                  {q.stimulus ? <StimulusFigure stimulus={q.stimulus} className="mb-4" /> : null}
                  <div
                    className="prose-tight text-[16px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderInline(q.stem) }}
                  />

                  <ul className="mt-5 flex flex-col gap-2">
                    {q.options.map((o) => {
                      const wasChosen = o.id === chosen;
                      return (
                        <li
                          key={o.id}
                          className={cn(
                            'flex items-center gap-3 rounded-[16px] p-2 pr-3 text-[15px]',
                            o.isCorrect &&
                              'bg-correct-soft shadow-[inset_0_0_0_1.5px_var(--color-correct)]',
                            wasChosen &&
                              !o.isCorrect &&
                              'bg-wrong-soft shadow-[inset_0_0_0_1.5px_var(--color-wrong)]',
                            !o.isCorrect &&
                              !wasChosen &&
                              'shadow-[inset_0_0_0_1px_var(--color-line-soft)]',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-[14px] font-medium',
                              o.isCorrect && 'bg-correct text-raised',
                              wasChosen && !o.isCorrect && 'bg-wrong text-raised',
                              !o.isCorrect && !wasChosen && 'bg-sunken text-muted',
                            )}
                          >
                            {o.isCorrect ? (
                              <CheckIcon size={14} />
                            ) : wasChosen ? (
                              <CrossIcon size={14} />
                            ) : (
                              o.label
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            {/* Icon options are an image and nothing else. */}
                            {o.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={o.imageUrl}
                                alt={o.imageAlt ?? ''}
                                className="max-h-28 rounded-sm bg-[#fff] p-1"
                              />
                            ) : null}
                            {o.content ? (
                              <span
                                className="block"
                                dangerouslySetInnerHTML={{ __html: renderInline(o.content) }}
                              />
                            ) : null}
                          </span>
                          {o.isCorrect || wasChosen ? (
                            <span
                              className={cn(
                                'shrink-0 text-[13px] font-medium',
                                o.isCorrect ? 'text-correct' : 'text-wrong',
                              )}
                            >
                              {o.isCorrect ? (wasChosen ? 'Your answer · correct' : 'Correct') : 'You chose'}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  {item.misconception ? (
                    <div className="mt-6 border-t border-line-soft pt-5">
                      <h3 className="text-[15px] font-medium">Why your answer was wrong</h3>
                      <div
                        className="mt-2 text-[15px] leading-relaxed text-muted"
                        dangerouslySetInnerHTML={{ __html: renderInline(item.misconception) }}
                      />
                    </div>
                  ) : null}

                  {q.explanation ? (
                    <div className="mt-5 border-t border-line-soft pt-5">
                      <h3 className="text-[15px] font-medium">Explanation</h3>
                      <div
                        className="prose-tight mt-2 text-[15px] leading-relaxed text-muted"
                        dangerouslySetInnerHTML={{ __html: renderInline(q.explanation) }}
                      />
                    </div>
                  ) : null}

                  {q.examTip ? (
                    <div className="tint-lilac mt-5 rounded-[20px] p-5">
                      <h3 className="text-[15px] font-medium">Exam tip</h3>
                      <div
                        className="mt-2 text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderInline(q.examTip) }}
                      />
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <AnswerConfidenceNote confidence={q.answerConfidence} />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

/* The unanswered count lives in the sheet's note, so the verdict doesn't repeat it. */
function verdict(percentage: number): string {
  if (percentage >= 90) return "That's a strong set.";
  if (percentage >= 70) return 'Solid work — a few gaps to close.';
  if (percentage >= 40) return 'Some of this is landing. The rest is now in your mistake book.';
  return 'A hard set. Everything you missed will come back for review.';
}

/** What the score line leaves out: how many were wrong, and how many skipped. */
function resultNote(incorrect: number, unanswered: number): string {
  const parts: string[] = [];
  if (incorrect > 0) parts.push(`${incorrect} wrong`);
  if (unanswered > 0) parts.push(`${unanswered} unanswered`);
  return parts.length > 0 ? parts.join(' · ') : 'Every question right';
}
