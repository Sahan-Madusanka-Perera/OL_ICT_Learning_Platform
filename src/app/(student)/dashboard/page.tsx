import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/auth/guards';
import {
  getMasteryForLevel,
  getOverallMastery,
  getWeakTopics,
  getStrongTopics,
  getTrend,
  getAnswerCounts,
} from '@/lib/services/mastery';
import { MIN_N_FOR_DISPLAY, type MasteryView } from '@/lib/domain/mastery';
import {
  getRecommendation,
  countMistakes,
  countDueReviews,
} from '@/lib/services/recommendations';
import { getRecentSessions, getActiveSession } from '@/lib/services/sessions';
import { getWeeklyActivity } from '@/lib/services/activity';
import { Window, Label, IconTile } from '@/components/ui/window';
import { Button, ButtonAffordance } from '@/components/ui/button';
import { Numeral } from '@/components/ui/bits';
import { MasteryBar, TrendPill } from '@/components/ui/mastery';
import { RecommendedCard } from '@/components/recommended-card';
import { ActivityStrip } from '@/components/activity-strip';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChartIcon,
  ClockIcon,
  FlagIcon,
  PlayIcon,
} from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';

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

  const [topics, overall, weak, strong, trend, counts, recommendation, mistakes, due, recent, active, activity] =
    await Promise.all([
      getMasteryForLevel(user.id, 'topic'),
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

  /* The same definitions the Progress page uses, so the two never disagree. */
  const measurable = topics.filter((t) => t.view.effectiveN >= MIN_N_FOR_DISPLAY).length;
  const practised = topics.filter((t) => t.attempts > 0).length;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/*
        The greeting sits on the wash rather than in a card — the reference's
        big light page title. A page that opens with a bordered box holding two
        short sentences spends a third of a phone viewport on chrome before
        saying anything.
      */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 px-1 pt-2 sm:pt-4">
        <div className="min-w-0">
          <h1 className="page-title">
            {isNew ? `Welcome, ${user.displayName}` : `Hello, ${user.displayName}`}
          </h1>
          <p className="mt-3 max-w-prose text-[15px] text-muted">
            {isNew
              ? 'Answer a few questions and this page starts telling you where you stand.'
              : summarise(counts.total, due, mistakes)}
          </p>
        </div>

        {/* ---- resume an unfinished session: it takes the ink pill ---- */}
        {active ? (
          <div className="glass flex w-full items-center gap-4 rounded-full py-2 pl-5 pr-2 sm:w-auto">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Session in progress</span>
              <span className="block text-[13px] text-muted">Pick up where you left off</span>
            </span>
            <Button asChild size="md">
              <Link href={`/session/${active.id}`}>
                Continue
                <ButtonAffordance>
                  <ArrowRightIcon size={14} />
                </ButtonAffordance>
              </Link>
            </Button>
          </div>
        ) : null}
      </header>

      {/* ---- what to do now, beside what you have been doing ---- */}
      <div className="stagger grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
        <RecommendedCard recommendation={recommendation} isNew={isNew} quiet={Boolean(active)} />

        <Window title="This week" note="Questions answered each day">
          <ActivityStrip days={activity} id="dash-week" />
        </Window>
      </div>

      {/*
        ---- where you are weak ----
        The reference's course cards: a row of standalone pastel tiles across
        the full width, each its own sheet rather than a list inside one.
      */}
      <section aria-labelledby="weak-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-1">
          <div>
            <h2
              id="weak-heading"
              className="text-[22px] leading-[1.2] tracking-[-0.025em]"
            >
              Worth your attention
            </h2>
            <p className="mt-1 text-[13px] text-muted">Your weakest topics, once we can tell</p>
          </div>
          {weak.length > 0 ? (
            <Button asChild size="md" variant="secondary">
              <Link href="/progress">All topics</Link>
            </Button>
          ) : null}
        </div>

        {weak.length === 0 ? (
          <div className="glass rounded-[24px] px-5 py-6 sm:rounded-xl sm:px-7">
            <p className="max-w-prose text-[15px] leading-relaxed text-muted">
              Nothing stands out yet. Once you have answered a handful of questions in a
              topic, weak areas appear here — and we won&rsquo;t guess before then.
            </p>
          </div>
        ) : (
          <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {weak.map((topic, i) => (
              <li key={topic.nodeId}>
                <TopicTile
                  nodeId={topic.nodeId}
                  code={topic.code}
                  title={topic.title}
                  view={topic.view}
                  tint={TILE_TINTS[i % TILE_TINTS.length]!}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- the rest of the picture ---- */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
        <Window title="On your list" note="What is waiting for you">
          <ul className="-mx-2 flex flex-col gap-1">
            <ListRow
              href="/mistakes"
              icon={<FlagIcon size={20} />}
              label="To fix"
              detail="Questions you got wrong"
              count={mistakes}
              tone="wrong"
            />
            <ListRow
              href="/practice"
              icon={<ClockIcon size={20} />}
              label="Due for review"
              detail="Spaced out so they stick"
              count={due}
              tone="ink"
            />
            <ListRow
              href="/progress"
              icon={<ChartIcon size={20} />}
              label="Topics we can measure"
              detail="Enough answers to say where you are"
              count={measurable}
              tone="ink"
            />
          </ul>
        </Window>

        <Window
          title="Where you stand"
          /* Its own height, not its neighbour's — stretching left a hollow middle. */
          className="h-auto"
          note={
            practised === 0
              ? 'Nothing practised yet'
              : practised >= topics.length
                ? 'Across the whole syllabus'
                : `From the ${practised} of ${topics.length} topics you have practised`
          }
          action={
            trend.trend !== 'unknown' ? (
              <TrendPill trend={trend.trend} delta={trend.delta} />
            ) : undefined
          }
        >
          <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
            <div>
              {overall.percentage === null ? (
                <p className="text-[22px] font-light leading-tight tracking-[-0.025em] text-muted">
                  Not measured yet
                </p>
              ) : (
                <p className="flex items-baseline gap-1.5">
                  <span className="display-xl text-[42px] leading-none tabular sm:text-[56px]">
                    {overall.percentage}
                  </span>
                  <span className="text-[22px] font-light text-muted">%</span>
                  {overall.confidence === 'low' ? (
                    <span className="ml-1 text-[13px] text-muted">estimate</span>
                  ) : null}
                </p>
              )}
              <MasteryBar view={overall} showLabel={false} className="mt-4" />
            </div>

            {overall.confidence === 'none' ? (
              <p className="text-[13px] leading-relaxed text-muted">
                We show a percentage once there is enough evidence to mean something.
                Keep practising and this fills in.
              </p>
            ) : (
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-[18px] bg-sunken px-4 py-3.5">
                  <Label as="dt">Answered</Label>
                  <dd className="mt-1.5">
                    <Numeral value={counts.total} slots={4} size="md" />
                  </dd>
                </div>
                <div className="rounded-[18px] bg-sunken px-4 py-3.5">
                  <Label as="dt">Accuracy</Label>
                  <dd className="mt-1.5">
                    {counts.accuracy === null ? (
                      <span className="text-[14px] text-muted">Not measured yet</span>
                    ) : (
                      <span className="flex items-baseline">
                        <Numeral value={counts.accuracy} slots={2} size="md" />
                        <span className="text-[15px] text-muted">%</span>
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </Window>
      </div>

      <div
        className={cn(
          'grid items-start gap-5 lg:gap-6',
          strong.length > 0 && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
        )}
      >
        <Window title="Recent sessions" note="Your last few sets">
          {recent.length === 0 ? (
            <p className="text-[15px] leading-relaxed text-muted">
              Sets you finish land here with their scores.
            </p>
          ) : (
            <ul
              className={cn(
                '-mx-2 grid gap-1',
                strong.length === 0 && 'sm:grid-cols-2 sm:gap-x-6',
              )}
            >
              {recent.map((s, i) => (
                <li key={s.id}>
                  <Link
                    href={s.status === 'active' ? `/session/${s.id}` : `/session/${s.id}/review`}
                    className="group flex items-center gap-3.5 rounded-[18px] px-2 py-2.5 transition-colors duration-200 hover:bg-sunken"
                  >
                    <IconTile tone={TINTS[i % TINTS.length]!}>
                      <PlayIcon size={16} />
                    </IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">
                        {MODE_LABEL[s.mode] ?? 'Practice'}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {s.status === 'active'
                          ? 'In progress'
                          : new Intl.DateTimeFormat('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            }).format(s.submittedAt ?? s.startedAt)}
                      </span>
                    </span>
                    {s.score !== null && s.maxScore ? (
                      <span className="shrink-0 text-[22px] font-light tracking-[-0.03em] tabular">
                        {s.score}
                        <span className="text-muted">/{s.maxScore}</span>
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium">
                        Resume
                        <ArrowRightIcon size={14} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Window>

        {strong.length > 0 ? (
          <Window title="Solid ground" note="Topics you can rely on">
            <ul className="flex flex-col gap-5">
              {strong.map((t) => (
                <li key={t.nodeId}>
                  <MasteryBar view={t.view} label={`${t.code} ${t.title}`} />
                </li>
              ))}
            </ul>
          </Window>
        ) : null}
      </div>
    </div>
  );
}

const TINTS = ['lilac', 'sky', 'mint'] as const;
const TILE_TINTS = ['lilac', 'sky', 'mint', 'peach'] as const;

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
 * One line of the list — the reference's homework row.
 *
 * An ink tile names the kind, the words say what it is, and the count sits on
 * the right in reserved digit slots, so the last digit of every count lands on
 * the same vertical and the three rows read as one register.
 *
 * A zero is drawn as a zero. "Nothing due" is a measurement, and replacing it
 * with a phrase would both break the column and quietly change the claim.
 *
 * Tone is applied to the numeral alone, never to the row. Washing the row red
 * because two questions need fixing would make a routine Tuesday look like an
 * emergency.
 */
function ListRow({
  href,
  icon,
  label,
  detail,
  count,
  tone,
}: {
  href: '/mistakes' | '/practice' | '/progress';
  icon: React.ReactNode;
  label: string;
  detail: string;
  count: number;
  tone: 'wrong' | 'ink';
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-touch items-center gap-4 rounded-[18px] px-2 py-2.5 transition-colors duration-200 hover:bg-sunken"
      >
        <IconTile>{icon}</IconTile>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px]">{label}</span>
          <span className="block text-[13px] text-muted">{detail}</span>
        </span>
        <span
          className={cn(
            'shrink-0',
            count === 0 && 'text-faint',
            count > 0 && tone === 'wrong' && 'text-wrong',
          )}
        >
          <Numeral value={count} slots={3} size="md" />
        </span>
      </Link>
    </li>
  );
}

/**
 * A weak topic as a standalone pastel tile — the reference's course card.
 * The tint is identity only (it cycles); the reading is the big light figure
 * and the meter beneath it, and an early estimate says so in words.
 */
function TopicTile({
  nodeId,
  code,
  title,
  view,
  tint,
}: {
  nodeId: string;
  code: string;
  title: string;
  view: MasteryView;
  tint: (typeof TILE_TINTS)[number];
}) {
  return (
    <Link
      href={`/progress/${nodeId}`}
      className={cn(
        'group flex h-full flex-col rounded-[24px] p-5 shadow-[var(--shadow-glass)] sm:rounded-xl sm:p-6',
        'transition-transform duration-300 ease-[var(--ease-settle)] hover:-translate-y-0.5',
        'motion-reduce:transform-none',
        tint === 'lilac' && 'tint-lilac',
        tint === 'sky' && 'tint-sky',
        tint === 'mint' && 'tint-mint',
        tint === 'peach' && 'tint-peach',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-[18px] leading-snug tracking-[-0.02em]">
          <span className="font-mono text-[14px] tracking-normal opacity-70">{code}</span>{' '}
          {title}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised/70 transition-transform duration-300 ease-[var(--ease-settle)] group-hover:rotate-45 motion-reduce:transform-none">
          <ArrowUpRightIcon size={16} />
        </span>
      </span>

      <span className="mt-auto block pt-6">
        {view.percentage === null ? (
          <span className="block text-[22px] font-light tracking-[-0.025em]">Not measured yet</span>
        ) : (
          <span className="flex items-baseline gap-1">
            <span className="display-xl text-[42px] leading-none tabular">{view.percentage}</span>
            <span className="text-[20px] font-light">%</span>
            {view.confidence === 'low' ? (
              <span className="ml-2 text-[13px] opacity-75">early estimate</span>
            ) : null}
          </span>
        )}
        <MasteryBar view={view} label={`${code} ${title}`} showLabel={false} className="mt-3 text-ink" />
      </span>
    </Link>
  );
}
