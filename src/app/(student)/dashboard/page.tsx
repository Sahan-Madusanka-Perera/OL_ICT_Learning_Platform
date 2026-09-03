import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/auth/guards';
import {
  getOverallMastery,
  getWeakTopics,
  getStrongTopics,
  getTrend,
  getAnswerCounts,
} from '@/lib/services/mastery';
import {
  getRecommendation,
  countMistakes,
  countDueReviews,
} from '@/lib/services/recommendations';
import { getRecentSessions, getActiveSession } from '@/lib/services/sessions';
import { getWeeklyActivity } from '@/lib/services/activity';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { Numeral } from '@/components/ui/bits';
import { MasteryBar, MasteryValue, TrendPill } from '@/components/ui/mastery';
import { RecommendedCard } from '@/components/recommended-card';
import { ActivityStrip } from '@/components/activity-strip';
import { ArrowRightIcon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Today' };

/**
 * The dashboard.
 *
 * It answers four questions in this order, and nothing else:
 *   1. What should I do right now?
 *   2. Where am I weak?
 *   3. Am I improving?
 *   4. What have I been doing?
 *
 * The recommendation comes first because it is the only part that is
 * actionable. Everything below it is context for that decision — and every
 * quantity on the page sits in reserved monumental digit slots, so the three
 * counts line up down the column instead of hiding inside sentences.
 */
export default async function DashboardPage() {
  const user = await requireUserPage('/dashboard');

  const [overall, weak, strong, trend, counts, recommendation, mistakes, due, recent, active, activity] =
    await Promise.all([
      getOverallMastery(user.id),
      getWeakTopics(user.id, 4),
      getStrongTopics(user.id, 3),
      getTrend(user.id),
      getAnswerCounts(user.id),
      getRecommendation(user.id, 15),
      countMistakes(user.id),
      countDueReviews(user.id),
      getRecentSessions(user.id, 4),
      getActiveSession(user.id),
      getWeeklyActivity(user.id),
    ]);

  const isNew = counts.total === 0;

  return (
    <div className="flex flex-col gap-3">
      {/*
        The greeting and the resume band both earn their place, but neither
        earns a stacked block of its own: between them they were spending a
        third of a phone viewport to say two short things, and pushing the
        register — a first-viewport element by contract — below the fold.
        Both are now single rows.
      */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-y border-ink bg-paper px-3 py-3 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">
          {isNew ? `Welcome, ${user.displayName}` : `Hello, ${user.displayName}`}
        </h1>
        <p className="text-[15px]">
          {isNew
            ? 'Answer a few questions and this page starts telling you where you stand.'
            : summarise(counts.total, due, mistakes)}
        </p>
      </header>

      {/* ---- resume an unfinished session ---- */}
      {active ? (
        <div className="flex items-center gap-3 border-y border-ink bg-paper px-3 py-2 sm:border-x sm:px-4">
          <Label className="min-w-0 flex-1">Session in progress</Label>
          <Button asChild size="md" variant="secondary">
            <Link href={`/session/${active.id}`}>Continue</Link>
          </Button>
        </div>
      ) : null}

      {/* ---- the recommendation: the page's one inverted control lives here ---- */}
      <RecommendedCard recommendation={recommendation} isNew={isNew} />

      {/* ---- the register ---- */}
      <Window title="Standing" bodyClassName="px-0 py-0 sm:px-0">
        <div className="grid gap-px bg-ink sm:grid-cols-3">
          <RegisterCell href="/mistakes" label="To fix" count={mistakes} />
          <RegisterCell href="/practice" label="Due for review" count={due} />
          <RegisterCell
            href="/progress"
            label="Topics with data"
            count={strong.length + weak.length}
          />
        </div>
      </Window>

      {/* ---- how am I doing ---- */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Window
          title="Where you stand"
          action={
            trend.trend !== 'unknown' ? (
              <TrendPill trend={trend.trend} delta={trend.delta} />
            ) : undefined
          }
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px]">Across the whole syllabus</span>
            <MasteryValue view={overall} />
          </div>
          <MasteryBar view={overall} showLabel={false} className="mt-2" />

          {overall.confidence === 'none' ? (
            <p className="mt-3 text-[13px] leading-relaxed">
              We show a percentage once there is enough evidence to mean something. Keep
              practising and this fills in.
            </p>
          ) : (
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-dashed border-ink pt-4">
              <div>
                <Label as="dt">Answered</Label>
                <dd className="mt-2">
                  <Numeral value={counts.total} slots={4} size="md" />
                </dd>
              </div>
              <div>
                <Label as="dt">Accuracy</Label>
                <dd className="mt-2">
                  {counts.accuracy === null ? (
                    <Label as="span">No reading yet</Label>
                  ) : (
                    <>
                      <Numeral value={counts.accuracy} slots={3} size="md" />
                      <span className="font-pixel text-[24px] leading-none">%</span>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </Window>

        <Window title="This week" note="Days practised">
          <ActivityStrip days={activity} />
        </Window>
      </div>

      {/* ---- weak topics ---- */}
      <Window
        title="Worth your attention"
        action={
          weak.length > 0 ? (
            <Button asChild size="md" variant="secondary">
              <Link href="/progress">All topics</Link>
            </Button>
          ) : undefined
        }
      >
        {weak.length === 0 ? (
          <p className="text-[15px] leading-relaxed">
            Nothing stands out yet. Once you have answered a handful of questions in a
            topic, weak areas appear here — and we won&rsquo;t guess before then.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {weak.map((topic) => (
              <li key={topic.nodeId}>
                <Link href={`/progress/${topic.nodeId}`} className="ant-focus block">
                  <MasteryBar view={topic.view} label={`${topic.code} ${topic.title}`} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Window>

      {/* ---- strengths + recent ---- */}
      <div className="grid gap-3 lg:grid-cols-2">
        {strong.length > 0 ? (
          <Window title="Solid ground" note="Topics you can rely on">
            <ul className="flex flex-col gap-4">
              {strong.map((t) => (
                <li key={t.nodeId}>
                  <MasteryBar view={t.view} label={`${t.code} ${t.title}`} />
                </li>
              ))}
            </ul>
          </Window>
        ) : null}

        {recent.length > 0 ? (
          <Window title="Recent sessions" bodyClassName="px-0 py-0 sm:px-0">
            <ul className="flex flex-col">
              {recent.map((s) => (
                <li key={s.id} className="border-b border-dashed border-ink last:border-b-0">
                  <Link
                    href={s.status === 'active' ? `/session/${s.id}` : `/session/${s.id}/review`}
                    className="ant-focus flex items-center justify-between gap-3 px-3 py-3 hover:bg-ink hover:text-paper sm:px-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">
                        {MODE_LABEL[s.mode] ?? 'Practice'}
                      </span>
                      <span className="font-pixel text-[16px] uppercase leading-none">
                        {s.status === 'active'
                          ? 'In progress'
                          : new Intl.DateTimeFormat('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            }).format(s.submittedAt ?? s.startedAt)}
                      </span>
                    </span>
                    {s.score !== null && s.maxScore ? (
                      <span className="font-pixel shrink-0 text-[16px] leading-none">
                        {s.score}/{s.maxScore}
                      </span>
                    ) : (
                      <span className="font-pixel flex shrink-0 items-center gap-1.5 text-[16px] uppercase leading-none">
                        Resume
                        <ArrowRightIcon size={12} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Window>
        ) : null}
      </div>
    </div>
  );
}

const MODE_LABEL: Record<string, string> = {
  quick: 'Quick practice',
  recommended: 'Recommended set',
  topic: 'Topic practice',
  weak_areas: 'Weak areas',
  mistakes: 'Mistake review',
  challenge: 'Challenge',
  past_paper: 'Past paper',
  mock_exam: 'Mock exam',
  bookmarks: 'Bookmarked',
  calibration: 'Getting started',
};

function summarise(total: number, due: number, mistakes: number): string {
  const parts: string[] = [];
  if (due > 0) parts.push(`${due} due for review`);
  if (mistakes > 0) parts.push(`${mistakes} to fix`);
  if (parts.length === 0) return `${total} questions answered so far. Nothing overdue.`;
  return `${parts.join(' · ')}.`;
}

/**
 * One slot of the register.
 *
 * Three reserved columns of the same width at the same scale, so the last
 * digit of every count lands on the same vertical — which is the whole point
 * of the reserved-slot raise, and the thing a row of separately-sized cards
 * can never do. A zero is drawn as a zero: "nothing due" is a measurement,
 * and hiding it behind a phrase would break the column.
 */
function RegisterCell({
  href,
  label,
  count,
}: {
  href: '/mistakes' | '/practice' | '/progress';
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="ant-focus group flex min-h-[--spacing-touch] items-center gap-4 bg-paper px-3 py-4 hover:bg-ink hover:text-paper sm:px-4"
    >
      <Numeral value={count} slots={3} size="xl" />
      <Label className="min-w-0 flex-1">{label}</Label>
    </Link>
  );
}
