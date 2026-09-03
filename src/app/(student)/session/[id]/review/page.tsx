import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUserPage } from '@/lib/auth/guards';
import { getSessionReview, submitSession } from '@/lib/services/sessions';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { BitStrip, Numeral } from '@/components/ui/bits';
import { SourceBadge, AnswerConfidenceNote } from '@/components/ui/source-badge';
import { renderInline } from '@/lib/utils/markdown';
import { cn } from '@/lib/utils/cn';
import { CheckIcon, CrossIcon, RingIcon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Results' };

/**
 * The results screen.
 *
 * A score alone teaches nothing, so the score is the smallest part of this
 * page — the topic breakdown and the per-question explanations are the
 * point. But the number that is here gets the monumental treatment, in
 * reserved digit slots, because it is the one thing a student came for and
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
    <div className="mx-auto flex max-w-3xl flex-col gap-3 px-0 py-4 sm:px-4 sm:py-8">
      {/* ---- score ---- */}
      <Window title="Result" note={`${result.percentage}%`}>
        <h1 className="flex items-baseline gap-2">
          <span className="font-pixel text-[48px] leading-none">
            <Numeral value={result.correct} slots={2} size="lg" className="text-[48px]" />
          </span>
          <span className="font-pixel text-[24px] uppercase leading-none">of</span>
          <span className="font-pixel text-[48px] leading-none">
            <Numeral value={result.maxScore} slots={2} size="lg" className="text-[48px]" />
          </span>
          <span className="font-pixel text-[24px] uppercase leading-none">correct</span>
        </h1>

        <BitStrip
          filled={result.correct}
          total={result.maxScore}
          className="mt-4"
          label={`${result.correct} of ${result.maxScore} correct`}
        />

        <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed">
          {verdict(result.percentage, result.unanswered)}
        </p>
      </Window>

      {/* ---- topic breakdown ---- */}
      {result.byTopic.length > 1 ? (
        <Window title="How it broke down" note="By topic">
          <ul className="flex flex-col gap-4">
            {result.byTopic.map((t) => (
              <li key={t.nodeId}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[15px]">{t.title}</span>
                  <span className="font-pixel shrink-0 text-[16px] leading-none">
                    {t.correct}/{t.total}
                  </span>
                </div>
                <BitStrip filled={t.correct} total={t.total} size="sm" className="mt-2" />
              </li>
            ))}
          </ul>
        </Window>
      ) : null}

      {/* ---- what next ---- */}
      <Window title="What next">
        <p className="text-[15px] leading-relaxed">
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
            'Nothing went into your mistake book from this set. Keep the streak going.'
          )}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg" full>
            <Link href="/dashboard">Back to today</Link>
          </Button>
          {result.incorrect > 0 ? (
            <Button asChild size="lg" variant="secondary" full>
              <Link href="/mistakes">Review my mistakes</Link>
            </Button>
          ) : null}
        </div>
      </Window>

      {/* ---- every question ---- */}
      <h2 className="font-pixel mt-4 border-y border-ink bg-paper px-3 py-3 text-[24px] uppercase leading-none sm:border-x sm:px-4">
        Every question
      </h2>

      <ol className="flex flex-col gap-3">
        {review.items.map((item, i) => {
          const q = item.question;
          if (!q) return null;
          const chosen = item.selectedOptionIds[0];

          return (
            <li key={q.id}>
              <article className="border-y border-ink bg-paper sm:border-x">
                <div
                  className={cn(
                    'flex flex-wrap items-center gap-2 border-b border-ink px-3 py-2 sm:px-4',
                    item.isCorrect === false && 'dither-25',
                  )}
                >
                  <span className="font-pixel text-[16px] uppercase leading-none">Q{i + 1}</span>
                  <span className="font-pixel inline-flex items-center gap-1.5 text-[16px] uppercase leading-none">
                    {item.isCorrect === true ? (
                      <>
                        <CheckIcon size={12} />
                        Correct
                      </>
                    ) : item.isCorrect === false ? (
                      <>
                        <CrossIcon size={12} />
                        Wrong
                      </>
                    ) : (
                      <>
                        <RingIcon size={12} />
                        Not attempted
                      </>
                    )}
                  </span>
                  <span className="ml-auto">
                    <SourceBadge source={q.source} />
                  </span>
                </div>

                <div className="px-3 py-4 sm:px-4">
                  <div
                    className="text-[15px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderInline(q.stem) }}
                  />

                  <ul className="mt-4 flex flex-col gap-1.5">
                    {q.options.map((o) => {
                      const wasChosen = o.id === chosen;
                      return (
                        <li
                          key={o.id}
                          className={cn(
                            'flex items-stretch border text-[15px]',
                            o.isCorrect && 'border-ink bg-ink text-paper',
                            wasChosen && !o.isCorrect && 'dither-25 border-ink',
                            !o.isCorrect && !wasChosen && 'border-dashed border-ink',
                          )}
                        >
                          <span className="font-pixel flex w-9 shrink-0 items-center justify-center border-r border-current text-[16px] leading-none">
                            {o.label}
                          </span>
                          <span
                            className="min-w-0 flex-1 px-3 py-2"
                            dangerouslySetInnerHTML={{ __html: renderInline(o.content ?? '') }}
                          />
                          {o.isCorrect || wasChosen ? (
                            <span className="font-pixel flex shrink-0 items-center px-3 text-[16px] uppercase leading-none">
                              {o.isCorrect ? 'Correct' : 'You chose'}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>

                  {item.misconception ? (
                    <div className="mt-5 border-t border-ink pt-3">
                      <Label as="h3">Why your answer was wrong</Label>
                      <div
                        className="mt-2 text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderInline(item.misconception) }}
                      />
                    </div>
                  ) : null}

                  {q.explanation ? (
                    <div className="mt-4 border-t border-dashed border-ink pt-3">
                      <Label as="h3">Explanation</Label>
                      <div
                        className="prose-tight mt-2 text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderInline(q.explanation) }}
                      />
                    </div>
                  ) : null}

                  {q.examTip ? (
                    <div className="mt-4 border-t border-dashed border-ink pt-3">
                      <Label as="h3">Exam tip</Label>
                      <div
                        className="mt-2 text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderInline(q.examTip) }}
                      />
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <AnswerConfidenceNote confidence={q.answerConfidence} />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function verdict(percentage: number, unanswered: number): string {
  const tail = unanswered > 0 ? ` ${unanswered} left unanswered.` : '';
  if (percentage >= 90) return `That's a strong set.${tail}`;
  if (percentage >= 70) return `Solid work — a few gaps to close.${tail}`;
  if (percentage >= 40)
    return `Some of this is landing. The rest is now in your mistake book.${tail}`;
  return `A hard set. Everything you missed will come back for review.${tail}`;
}
