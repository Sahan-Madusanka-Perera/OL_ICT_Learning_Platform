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
import { Window, Label } from '@/components/ui/window';
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
 * Measured and unmeasured topics take visibly different materials — a bit
 * strip against a 12% dither behind a dashed rule — so "we have not measured
 * this" can never be mistaken for "you scored nothing".
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
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Progress</h1>
        <p className="mt-2 text-[15px]">
          {counts.total === 0
            ? 'Answer some questions and this fills in.'
            : `${counts.total} questions answered · ${counts.accuracy}% overall accuracy`}
        </p>
      </header>

      {counts.total === 0 ? (
        <Window title="Nothing to show you yet">
          <p className="text-[15px] leading-relaxed">
            This page fills in as you practise. Answer around {MIN_N_FOR_DISPLAY} questions
            in a topic and it starts carrying a score — before that we would only be
            guessing, so we say nothing.
          </p>
          <Button asChild size="lg" full className="mt-5">
            <Link href="/practice">Start practising</Link>
          </Button>
        </Window>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Window
          title="Overall mastery"
          action={
            trend.trend !== 'unknown' ? (
              <TrendPill trend={trend.trend} delta={trend.delta} />
            ) : undefined
          }
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px]">Across the syllabus</span>
            <MasteryValue view={overall} />
          </div>
          <MasteryBar view={overall} showLabel={false} className="mt-2" />
          <p className="mt-3 text-[13px] leading-relaxed">
            Weighted by question difficulty, with older evidence counting less. A topic
            needs at least {MIN_N_FOR_DISPLAY} questions before we put a number on it.
          </p>
        </Window>

        <Window title="This week">
          <ActivityStrip days={activity} />
        </Window>
      </div>

      {/* ---- units ---- */}
      <Window title="By unit" note="15 units" bodyClassName="px-0 py-0 sm:px-0">
        <ul>
          {units.map((unit) => (
            <li key={unit.nodeId} className="border-b border-dashed border-ink last:border-b-0">
              <Link
                href={`/progress/${unit.nodeId}`}
                className="ant-focus block px-3 py-3 hover:bg-ink hover:text-paper sm:px-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[15px]">
                    <span className="font-pixel text-[16px]">{unit.code}</span> {unit.title}
                  </span>
                  <MasteryValue view={unit.view} />
                </div>
                <MasteryBar view={unit.view} showLabel={false} className="mt-2" />
              </Link>
            </li>
          ))}
        </ul>
      </Window>

      {/* ---- topics with enough data ---- */}
      {measured.length > 0 ? (
        <Window title="Topics we can measure" note={`${measured.length}`}>
          <ul className="flex flex-col gap-4">
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
        <Window title="Not started yet" note={`${unstarted.length}`}>
          <p className="text-[13px] leading-relaxed">
            These are not weak — they are unknown. We keep them separate so a topic you
            have simply not reached does not look like one you are failing.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {unstarted.map((t) => (
              <li key={t.nodeId}>
                <span className="dither-12 inline-block border border-dashed border-ink px-2 py-1 text-[13px]">
                  <span className="font-pixel text-[16px]">{t.code}</span> {t.title}
                </span>
              </li>
            ))}
          </ul>
        </Window>
      ) : null}
    </div>
  );
}
