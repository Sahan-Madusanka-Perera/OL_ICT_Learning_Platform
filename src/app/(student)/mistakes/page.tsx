import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/auth/guards';
import { getMistakeBook } from '@/lib/services/recommendations';
import { startMistakePractice } from '@/lib/actions/practice';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
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
 * Each question shows its history beside its state: the box strip is the
 * record of how many times in a row it has come back correct, which in a
 * one-bit world is literally the data rather than a picture of it.
 */
export default async function MistakesPage() {
  const user = await requireUserPage('/mistakes');
  const mistakes = await getMistakeBook(user.id, 100);

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
          <h1 className="font-pixel text-[24px] uppercase leading-tight">My mistakes</h1>
        </header>
        <Window title="Nothing to fix right now">
          <p className="text-[15px] leading-relaxed">
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
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">My mistakes</h1>
        <p className="mt-2 text-[15px]">
          {mistakes.length} {mistakes.length === 1 ? 'question' : 'questions'} to fix
          {dueNow > 0 ? ` · ${dueNow} due now` : ''}
        </p>
      </header>

      <Window title="Work through them" note={dueNow > 0 ? `${dueNow} due` : undefined}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-center">
            <Numeral value={mistakes.length} slots={3} size="lg" />
            <Label className="mt-1.5">To fix</Label>
          </div>
          <p className="flex-1 text-[15px] leading-relaxed">
            A question leaves this list once you have answered it correctly{' '}
            {GRADUATION_BOX} times in a row across widening intervals — up to{' '}
            {BOX_INTERVALS_DAYS[GRADUATION_BOX]} days apart. That is what makes it stick.
          </p>
        </div>
        <form action={startMistakePractice} className="mt-5">
          <Button type="submit" size="lg" full>
            Start review
          </Button>
        </form>
      </Window>

      {groups.map((group) => {
        const first = group[0]!;
        return (
          <Window
            key={first.nodeId}
            title={`${first.nodeCode} ${first.nodeTitle}`}
            note={`${group.length}`}
            bodyClassName="px-0 py-0 sm:px-0"
          >
            <ul>
              {group.map((m) => (
                <li
                  key={m.questionId}
                  className="border-b border-dashed border-ink px-3 py-3.5 last:border-b-0 sm:px-4"
                >
                  <div
                    className="line-clamp-2 text-[15px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderInline(m.stem) }}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {/* The form carries every crease: the box strip is the record. */}
                    <span className="flex items-center gap-2">
                      <Label as="span">Step</Label>
                      <BitStrip
                        filled={m.box + 1}
                        total={GRADUATION_BOX + 1}
                        size="sm"
                        className="w-24"
                        label={`Step ${m.box} of ${GRADUATION_BOX} toward leaving this list`}
                      />
                    </span>

                    <span className="font-pixel text-[16px] uppercase leading-none">
                      {m.correctAttempts}/{m.attempts} correct
                    </span>

                    {m.nextReviewAt ? (
                      <span className="font-pixel text-[16px] uppercase leading-none">
                        {m.nextReviewAt.getTime() <= Date.now()
                          ? 'Due now'
                          : `Next ${new Intl.DateTimeFormat('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            }).format(m.nextReviewAt)}`}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Window>
        );
      })}
    </div>
  );
}
