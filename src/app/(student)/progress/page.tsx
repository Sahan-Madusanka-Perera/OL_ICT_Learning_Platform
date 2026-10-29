import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/auth/guards';
import {
  getMasteryForLevel,
  getOverallMastery,
  getTrend,
  getAnswerCounts,
} from '@/lib/services/mastery';
import { getWeeklyActivity } from '@/lib/services/activity';
import { Window } from '@/components/ui/window';
import { MasteryBar, MasteryValue, TrendPill } from '@/components/ui/mastery';
import { ActivityStrip } from '@/components/activity-strip';
import { Button } from '@/components/ui/button';
import { Numeral } from '@/components/ui/bits';
import { MIN_N_FOR_DISPLAY } from '@/lib/domain/mastery';

export const metadata: Metadata = { title: 'Progress' };

/**
 * The progress map.
 *
 * Three lists, not a wall of charts: what has data, what is strong, what has
 * not been started. The third is what most progress screens hide, and it is
 * usually the most useful thing on the page three weeks before an exam.
 *
 * Measured and unmeasured topics take visibly different materials — a filled
 * meter against a dashed outline with nothing inside — so "we have not
 * measured this" can never be mistaken for "you scored nothing".
 */
export default async function ProgressPage() {
  const user = await requireUserPage('/progress');

  const [units, topics, overall, trend, counts, activity] = await Promise.all([
    getMasteryForLevel(user.id, 'unit'),
    getMasteryForLevel(user.id, 'topic'),
    getOverallMastery(user.id),
    getTrend(user.id),
    getAnswerCounts(user.id),
    getWeeklyActivity(user.id),
  ]);

  const measured = topics.filter((t) => t.view.effectiveN >= MIN_N_FOR_DISPLAY);
  const unstarted = topics.filter((t) => t.attempts === 0);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="px-1 pt-2 sm:pt-4">
        <h1 className="page-title">Progress</h1>
        <p className="mt-3 text-[15px] text-muted">
          {counts.total === 0
            ? 'Answer some questions and this fills in.'
            : `${counts.total} questions answered · ${counts.accuracy}% overall accuracy`}
        </p>
      </header>

      {counts.total === 0 ? (
        <Window tone="raised" title="Nothing to show you yet" note="This page fills in as you practise">
          <p className="max-w-prose text-[15px] leading-relaxed text-muted">
            Answer around {MIN_N_FOR_DISPLAY} questions in a topic and it starts carrying a
            score — before that we would only be guessing, so we say nothing.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/practice">Start practising</Link>
          </Button>
        </Window>
      ) : null}

      <div className="stagger grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
        <Window
          title="Overall mastery"
          note={
            topics.length - unstarted.length >= topics.length
              ? 'Across the whole syllabus'
              : `From the ${topics.length - unstarted.length} of ${topics.length} topics you have practised`
          }
          action={
            trend.trend !== 'unknown' ? (
              <TrendPill trend={trend.trend} delta={trend.delta} />
            ) : undefined
          }
        >
          {overall.percentage === null ? (
            <p className="text-[22px] font-light leading-tight tracking-[-0.025em] text-muted">
              Not measured yet
            </p>
          ) : (
            <p className="flex items-baseline gap-1.5">
              <Numeral value={overall.percentage} slots={2} size="xl" />
              <span className="text-[22px] font-light text-muted">%</span>
              {overall.confidence === 'low' ? (
                <span className="ml-1 text-[13px] text-muted">estimate</span>
              ) : null}
            </p>
          )}
          <MasteryBar view={overall} showLabel={false} className="mt-4" />
          <p className="mt-5 text-[13px] leading-relaxed text-muted">
            Weighted by question difficulty, with older evidence counting less. A topic
            needs at least {MIN_N_FOR_DISPLAY} questions before we put a number on it.
          </p>
        </Window>

        <Window title="This week" note="Questions answered each day">
          <ActivityStrip days={activity} id="progress-week" />
        </Window>
      </div>

      {/* ---- units ---- */}
      <Window title="By unit" count={units.length} note="Open a unit to see its topics" bodyClassName="px-3 pb-3 sm:px-4 sm:pb-4">
        <ul className="grid gap-x-4 gap-y-0.5 lg:grid-cols-2">
          {units.map((unit) => (
            <li key={unit.nodeId}>
              <Link
                href={`/progress/${unit.nodeId}`}
                className="group flex items-center gap-3.5 rounded-[18px] px-2 py-3 transition-colors duration-200 hover:bg-sunken sm:px-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-sunken text-[14px] font-medium tabular transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-ink">
                  {unit.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px]">{unit.title}</span>
                    <MasteryValue view={unit.view} />
                  </span>
                  <MasteryBar view={unit.view} showLabel={false} className="mt-2" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Window>

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        {/* ---- topics with enough data ---- */}
        {measured.length > 0 ? (
          <Window title="Topics we can measure" count={measured.length} note="Weakest first">
            <ul className="flex flex-col gap-5">
              {[...measured]
                .sort((a, b) => a.view.mastery - b.view.mastery)
                .map((t) => (
                  <li key={t.nodeId}>
                    <MasteryBar view={t.view} label={`${t.code} ${t.title}`} />
                  </li>
                ))}
            </ul>
          </Window>
        ) : null}

        {/* ---- honest about what hasn't been touched ---- */}
        {unstarted.length > 0 ? (
          <Window title="Not started yet" count={unstarted.length} note="Unknown, not weak">
            <p className="text-[14px] leading-relaxed text-muted">
              We keep these separate so a topic you have simply not reached does not look
              like one you are failing.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {unstarted.map((t) => (
                <li key={t.nodeId}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-faint/60 px-3 py-1.5 text-[13px] text-muted">
                    <span className="font-medium text-ink tabular">{t.code}</span>
                    {t.title}
                  </span>
                </li>
              ))}
            </ul>
          </Window>
        ) : null}
      </div>
    </div>
  );
}
