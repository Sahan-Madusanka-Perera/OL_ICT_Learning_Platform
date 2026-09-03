import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/guards';
import {
  getReviewQueue,
  getReviewQueueYears,
  countQueueWithFigures,
} from '@/lib/services/review';
import { getQuestionsForGrading } from '@/lib/services/questions';
import { can } from '@/lib/auth/rbac';
import { ReviewCard } from './review-card';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Review queue' };

/**
 * The review queue.
 *
 * Ordered so the blocking work comes first: a question with no answer key
 * cannot move at all, so it sits at the top regardless of when it arrived.
 */
export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; figures?: string }>;
}) {
  const user = await requireStaffPage();
  const params = await searchParams;

  const yearParam = Number(params.year);
  const year = Number.isInteger(yearParam) ? yearParam : undefined;
  const onlyFigures = params.figures === '1';

  const [queue, years, figureCount] = await Promise.all([
    getReviewQueue(50, { year, hasFigure: onlyFigures ? true : undefined }),
    getReviewQueueYears(),
    countQueueWithFigures(),
  ]);

  const full = await getQuestionsForGrading(queue.map((q) => q.id));
  const byId = new Map(full.map((q) => [q.id, q]));

  const needsKey = queue.filter((q) => !q.hasKey);
  const rest = queue.filter((q) => q.hasKey);
  const filtered = year !== undefined || onlyFigures;

  return (
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Review queue</h1>
        <p className="mt-2 text-[15px]">
          {queue.length} {queue.length === 1 ? 'question' : 'questions'} shown
          {needsKey.length > 0 ? ` · ${needsKey.length} with no answer key` : ''}
          {filtered ? '' : ' · oldest paper first'}
        </p>
      </header>

      {/*
        The queue is far longer than one page of it. Ordering is by paper and
        question number so a reviewer keeps their place, which means without
        these controls only the oldest paper is ever reachable — and every
        recovered figure is on a 2020+ paper.
      */}
      <Window title="Filter">
        <form className="flex flex-wrap items-center gap-2">
          <select
            name="year"
            defaultValue={year !== undefined ? String(year) : ''}
            aria-label="Paper year"
            className="font-pixel h-10 border border-ink bg-paper px-2 text-[16px] uppercase"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>

          <label className="flex h-10 items-center gap-2 border border-ink px-3 text-[15px]">
            <input
              type="checkbox"
              name="figures"
              value="1"
              defaultChecked={onlyFigures}
              className="h-4 w-4"
            />
            Only questions with a figure ({figureCount})
          </label>

          <Button type="submit" size="md">
            Filter
          </Button>
        </form>
      </Window>

      {queue.length === 0 ? (
        <Window title={filtered ? 'Nothing matches that filter' : 'The queue is empty'}>
          <p className="text-[15px] leading-relaxed">
            {filtered
              ? 'No question in the queue matches. Try another year, or clear the filter.'
              : 'Everything has been reviewed.'}
          </p>
        </Window>
      ) : null}

      {needsKey.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Window title="No answer key — blocked" note={`${needsKey.length}`} className="border-y-2 sm:border-x-2">
            <p className="max-w-2xl text-[15px] leading-relaxed">
              These came from past papers for years whose marking scheme we do not hold, or
              from questions the Department marked with more than one accepted option. Work
              out the answer, set it, then approve. Past-paper questions need a second,
              independent approver before they can be published.
            </p>
          </Window>

          <ul className="flex flex-col gap-3">
            {needsKey.map((item) => (
              <li key={item.id}>
                <ReviewCard
                  item={item}
                  question={byId.get(item.id) ?? null}
                  canApprove={can(user.role, 'question:approve')}
                  canPublish={can(user.role, 'question:publish')}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="border-y border-ink bg-paper px-3 py-2.5 sm:border-x sm:px-4">
            <Label as="h2">Ready to review</Label>
          </div>
          <ul className="flex flex-col gap-3">
            {rest.map((item) => (
              <li key={item.id}>
                <ReviewCard
                  item={item}
                  question={byId.get(item.id) ?? null}
                  canApprove={can(user.role, 'question:approve')}
                  canPublish={can(user.role, 'question:publish')}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
