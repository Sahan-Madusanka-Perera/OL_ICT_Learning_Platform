import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/auth/guards';
import { getMistakeBook } from '@/lib/services/recommendations';
import { startMistakePractice } from '@/lib/actions/practice';
import { Window, ROW } from '@/components/ui/window';
import { Button, ButtonAffordance } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import { BitStrip, Numeral } from '@/components/ui/bits';
import { renderInline } from '@/lib/utils/markdown';
import { BOX_INTERVALS_DAYS, GRADUATION_BOX } from '@/lib/domain/scheduling';

export const metadata: Metadata = { title: 'My mistakes' };

/**
 * The Mistake Book.
 *
 * Grouped by topic, because five wrong answers in one topic is a different
 * problem from five spread across the syllabus — and the grouping is what
 * makes that visible.
 *
 * Each question shows its history beside its state: the step meter is the
 * record of how many times in a row it has come back correct.
 */
export default async function MistakesPage() {
  const user = await requireUserPage('/mistakes');
  const mistakes = await getMistakeBook(user.id, 100);

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        <header className="px-1 pt-2 sm:pt-4">
          <h1 className="page-title">My mistakes</h1>
        </header>
        <Window tone="raised" title="Nothing to fix right now" note="Your mistake book is empty">
          <p className="max-w-prose text-[15px] leading-relaxed text-muted">
            Questions you get wrong land here, and stay until you have answered them
            correctly enough times to be sure it wasn&rsquo;t luck.
          </p>
        </Window>
      </div>
    );
  }

  const byTopic = new Map<string, typeof mistakes>();
  for (const m of mistakes) {
    const list = byTopic.get(m.nodeId) ?? [];
    list.push(m);
    byTopic.set(m.nodeId, list);
  }

  const groups = [...byTopic.values()].sort((a, b) => b.length - a.length);
  const dueNow = mistakes.filter(
    (m) => m.nextReviewAt && m.nextReviewAt.getTime() <= Date.now(),
  ).length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="px-1 pt-2 sm:pt-4">
        <h1 className="page-title">My mistakes</h1>
        <p className="mt-3 text-[15px] text-muted">
          {mistakes.length} {mistakes.length === 1 ? 'question' : 'questions'} to fix
          {dueNow > 0 ? ` · ${dueNow} due now` : ''}
        </p>
      </header>

      <div className="stagger grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
        <div className="lg:sticky lg:top-28">
          <Window tone="peach" title="Work through them" note={dueNow > 0 ? `${dueNow} due now` : 'None due right now'}>
            <div>
              <p className="flex items-baseline gap-2.5">
                <Numeral value={mistakes.length} slots={0} size="xl" />
                <span className="text-[18px] tracking-[-0.02em]">to fix</span>
              </p>
              <p className="mt-3 text-[15px] leading-relaxed opacity-85">
                A question leaves this list once you have answered it correctly{' '}
                {GRADUATION_BOX} times in a row across widening intervals — up to{' '}
                {BOX_INTERVALS_DAYS[GRADUATION_BOX]} days apart. That is what makes it stick.
              </p>
            </div>
            <form action={startMistakePractice} className="mt-5">
              <Button type="submit" size="lg" full>
                Start review
                <ButtonAffordance>
                  <ArrowRightIcon size={14} />
                </ButtonAffordance>
              </Button>
            </form>
          </Window>
        </div>

        <div className="flex flex-col gap-5 lg:gap-6">
          {groups.map((group) => {
            const first = group[0]!;
            return (
              <Window
                key={first.nodeId}
                title={first.nodeTitle}
                count={group.length}
                note={`Topic ${first.nodeCode}`}
                bodyClassName="px-0 pb-2 sm:px-0 sm:pb-2"
              >
                <ul>
                  {group.map((m) => {
                    const due = m.nextReviewAt && m.nextReviewAt.getTime() <= Date.now();
                    return (
                      <li
                        key={m.questionId}
                        className={cn('border-t border-line-soft py-4', ROW)}
                      >
                        <div
                          className="line-clamp-2 text-[15px] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderInline(m.stem) }}
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
                          <span className="flex items-center gap-2.5">
                            Step {m.box} of {GRADUATION_BOX}
                            <BitStrip
                              filled={m.box + 1}
                              total={GRADUATION_BOX + 1}
                              size="sm"
                              className="w-20"
                              label={`Step ${m.box} of ${GRADUATION_BOX} toward leaving this list`}
                            />
                          </span>

                          <span className="tabular">
                            {m.correctAttempts}/{m.attempts} correct
                          </span>

                          {m.nextReviewAt ? (
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-1 text-[12px] font-medium',
                                due ? 'bg-accent text-accent-ink' : 'bg-sunken',
                              )}
                            >
                              {due
                                ? 'Due now'
                                : `Next ${new Intl.DateTimeFormat('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                  }).format(m.nextReviewAt)}`}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Window>
            );
          })}
        </div>
      </div>
    </div>
  );
}
