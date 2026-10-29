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
import { Window } from '@/components/ui/window';
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
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="px-1 pb-3 pt-4 sm:pt-6">
        <h1 className="page-title">Review queue</h1>
        <p className="mt-3 text-[16px] text-muted tabular">
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
      <form className="glass flex flex-wrap items-center gap-2.5 rounded-[24px] p-3 sm:rounded-full sm:p-2">
        <select
          name="year"
          defaultValue={year !== undefined ? String(year) : ''}
          aria-label="Paper year"
          className="h-12 flex-1 rounded-full bg-sunken px-5 text-[15px] sm:flex-none"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>

        <label className="flex h-12 flex-[1_1_16rem] cursor-pointer items-center gap-3 rounded-full bg-sunken px-5 text-[15px] has-[:checked]:bg-accent has-[:checked]:text-accent-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
          <input
            type="checkbox"
            name="figures"
            value="1"
            defaultChecked={onlyFigures}
            className="h-4 w-4 accent-current"
          />
          Only questions with a figure
          <span className="ml-auto tabular opacity-70">{figureCount}</span>
        </label>

        <Button type="submit" size="md">
          Filter
        </Button>
      </form>

      {queue.length === 0 ? (
        <Window title={filtered ? 'Nothing matches that filter' : 'The queue is empty'}>
          <p className="text-[15px] leading-relaxed text-muted">
            {filtered
              ? 'No question in the queue matches. Try another year, or clear the filter.'
              : 'Everything has been reviewed.'}
          </p>
        </Window>
      ) : null}

      {needsKey.length > 0 ? (
        <section className="flex flex-col gap-4">
          <Window
            tone="raised"
            title="No answer key — blocked"
            count={needsKey.length}
            note="These cannot move until a key is set"
          >
            <p className="max-w-[68ch] text-[15px] leading-relaxed text-muted">
              These came from past papers for years whose marking scheme we do not hold, or
              from questions the Department marked with more than one accepted option. Work
              out the answer, set it, then approve. Past-paper questions need a second,
              independent approver before they can be published.
            </p>
          </Window>

          <ul className="flex flex-col gap-4">
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
        <section aria-labelledby="ready-heading" className="flex flex-col gap-4">
          <h2 id="ready-heading" className="flex items-center gap-3 px-1 pt-4 text-[22px] tracking-[-0.025em]">
            Ready to review
            <span className="rounded-full bg-sunken px-2.5 py-0.5 text-[13px] font-medium tracking-normal text-muted tabular">
              {rest.length}
            </span>
          </h2>
          <ul className="flex flex-col gap-4">
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
