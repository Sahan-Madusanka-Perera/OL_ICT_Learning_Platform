import type { ActivityDay } from '@/lib/services/activity';
import { cn } from '@/lib/utils/cn';
import { ArrowUpIcon } from '@/components/ui/icon';

/**
 * The week, drawn.
 *
 * Two overlapping areas — questions answered, and the ones answered correctly
 * — filled with fine vertical rules the way the reference draws its
 * performance chart. Correct is a subset of answered, so the areas overlap
 * rather than stack: the gap between the two curves *is* the wrong answers.
 *
 * It is server-rendered SVG and costs no JavaScript. Everything that has to
 * stay crisp lives in HTML over the plot — the axis labels, the peak marker,
 * the callout, the hover tooltips — so the SVG can stretch to any width while
 * its lines keep a true 2px stroke.
 *
 * A phone has no hover, so each day's count is also printed under its label;
 * a chart you cannot read without hovering is decoration on a touchscreen.
 * The same numbers sit in a visually hidden table for a screen reader.
 *
 * The two series colours are validated as a pair for colour-blind separation
 * in both themes, and the legend names them — identity never rides on colour
 * alone.
 */

const W = 700;
const H = 200;
const HEADROOM = 18;

export function ActivityStrip({ days, id = 'week' }: { days: ActivityDay[]; id?: string }) {
  const n = days.length;
  const peakValue = Math.max(0, ...days.map((d) => d.answered));
  const max = niceMax(peakValue);
  const total = days.reduce((sum, d) => sum + d.answered, 0);
  const correct = days.reduce((sum, d) => sum + d.correct, 0);
  const activeDays = days.filter((d) => d.answered > 0).length;

  /* The latest day that hit the peak — "today" wins a tie with last Tuesday. */
  const peakIndex = total === 0 ? -1 : lastIndexOf(days, (d) => d.answered === peakValue);
  const peak = peakIndex >= 0 ? days[peakIndex]! : null;

  const x = (i: number) => ((i + 0.5) / n) * W;
  const y = (v: number) => H - (v / max) * (H - HEADROOM);

  /* Each day owns its band, so the curve runs flat to the plot's edges. */
  const series = (pick: (d: ActivityDay) => number): Pt[] => [
    [0, y(pick(days[0]!))],
    ...days.map((d, i): Pt => [x(i), y(pick(d))]),
    [W, y(pick(days[n - 1]!))],
  ];

  const answered = series((d) => d.answered);
  const right = series((d) => d.correct);
  const answeredLine = monotonePath(answered);
  const rightLine = monotonePath(right);
  const close = `L${W},${H} L0,${H} Z`;

  const ticks = [max, max / 2, 0];
  const plotRight = 'right-10';

  return (
    <figure className="m-0">
      <figcaption className="sr-only-live">
        Questions answered in the last seven days: {total} across {activeDays}{' '}
        {activeDays === 1 ? 'day' : 'days'}, {correct} correct.
      </figcaption>

      {/* ---- legend ---- */}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-series-1" />
          Answered
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-series-2" />
          Correct
        </li>
      </ul>

      {/* ---- plot ---- */}
      <div className="relative mt-5 h-[168px] sm:h-[212px]" aria-hidden="true">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className={cn('draw-in absolute inset-y-0 left-0 h-full w-[calc(100%-2.5rem)] overflow-visible')}
        >
          <defs>
            <pattern id={`${id}-rule-a`} width="5" height="5" patternUnits="userSpaceOnUse">
              <rect width="1.5" height="5" style={{ fill: 'var(--color-series-1)' }} />
            </pattern>
            <pattern id={`${id}-rule-b`} width="5" height="5" patternUnits="userSpaceOnUse">
              <rect x="2.5" width="1.5" height="5" style={{ fill: 'var(--color-series-2)' }} />
            </pattern>
            <linearGradient id={`${id}-wash-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--color-series-1)', stopOpacity: 0.16 }} />
              <stop offset="1" style={{ stopColor: 'var(--color-series-1)', stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.62" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
            </linearGradient>
            <mask id={`${id}-mask`} maskContentUnits="userSpaceOnUse">
              <rect width={W} height={H} fill={`url(#${id}-fade)`} />
            </mask>
          </defs>

          {/* gridlines — hairline, solid, recessive */}
          {ticks.map((t) => (
            <line
              key={t}
              x1="0"
              x2={W}
              y1={y(t)}
              y2={y(t)}
              vectorEffect="non-scaling-stroke"
              style={{ stroke: 'var(--color-line-soft)', strokeWidth: 1 }}
            />
          ))}

          <path d={`${answeredLine} ${close}`} fill={`url(#${id}-wash-a)`} />
          <g mask={`url(#${id}-mask)`}>
            <path d={`${answeredLine} ${close}`} fill={`url(#${id}-rule-a)`} />
            <path d={`${rightLine} ${close}`} fill={`url(#${id}-rule-b)`} />
          </g>

          <path
            d={answeredLine}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: 'var(--color-series-1)', strokeWidth: 2 }}
          />
          <path
            d={rightLine}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: 'var(--color-series-2)', strokeWidth: 2 }}
          />
        </svg>

        {/* y-axis, on the right like the reference */}
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 w-9 -translate-y-1/2 text-right text-[12px] leading-none text-faint tabular"
            style={{ top: `${(y(t) / H) * 100}%` }}
          >
            {t}
          </span>
        ))}

        {/* hover columns: a hairline and a tooltip per day, CSS only */}
        <div className={cn('absolute inset-y-0 left-0 grid grid-cols-7', plotRight)}>
          {days.map((d) => (
            <div key={d.date} className="group relative">
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <span
                className={cn(
                  'pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2',
                  'whitespace-nowrap rounded-[12px] bg-raised px-3 py-2 text-[12px] leading-snug text-ink',
                  'opacity-0 shadow-[inset_0_0_0_1px_var(--color-line-soft),var(--shadow-float)]',
                  'transition-[opacity,transform] duration-200 ease-[var(--ease-settle)]',
                  'group-hover:translate-y-0 group-hover:opacity-100',
                )}
              >
                <span className="block font-medium">{longDay(d.date)}</span>
                <span className="block text-muted">
                  {d.answered} answered · {d.correct} correct
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* the peak: a ringed marker and an ink callout */}
        {peak ? (
          <Callout
            xFrac={(peakIndex + 0.5) / n}
            yPct={(y(peak.answered) / H) * 100}
            value={peak.answered}
            caption={peak.isToday ? 'answered today' : `answered on ${shortDay(peak.date)}`}
          />
        ) : null}

        {total === 0 ? (
          <p className="absolute inset-y-0 left-0 right-10 flex items-center justify-center">
            <span className="rounded-full bg-raised px-4 py-2 text-[14px] text-muted shadow-[inset_0_0_0_1px_var(--color-line-soft),var(--shadow-raised)]">
              No practice yet this week
            </span>
          </p>
        ) : null}
      </div>

      {/* ---- days ---- */}
      <ol className="mt-4 grid grid-cols-7 gap-1.5 pr-10 sm:gap-2" aria-hidden="true">
        {days.map((d) => (
          <li key={d.date} className="flex min-w-0 flex-col items-center gap-2">
            <span
              className={cn(
                'h-1.5 w-full rounded-full',
                d.answered > 0 ? 'meter-fill' : 'bg-sunken',
              )}
            />
            <span
              className={cn(
                'text-[13px] leading-none',
                d.isToday ? 'font-medium text-ink' : 'text-muted',
              )}
            >
              {shortDay(d.date)}
            </span>
            <span className="text-[12px] leading-none text-faint tabular">{d.answered}</span>
          </li>
        ))}
      </ol>

      {/* ---- the same facts, as a table ---- */}
      <table className="sr-only-live">
        <caption>Questions answered per day, last seven days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Answered</th>
            <th scope="col">Correct</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{longDay(d.date)}</th>
              <td>{d.answered}</td>
              <td>{d.correct}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 text-[14px] text-muted">
        {total === 0
          ? 'Answer a few questions and the week fills in.'
          : `${total} ${total === 1 ? 'question' : 'questions'} across ${activeDays} ${
              activeDays === 1 ? 'day' : 'days'
            } · ${correct} correct`}
      </p>
    </figure>
  );
}

function Callout({
  xFrac,
  yPct,
  value,
  caption,
}: {
  xFrac: number;
  yPct: number;
  value: number;
  caption: string;
}) {
  const left = `calc((100% - 2.5rem) * ${xFrac})`;
  const onLeft = xFrac > 0.5;
  /* Keep the callout inside the plot when the peak sits near its floor. */
  const top = `${Math.min(Math.max(yPct, 22), 72)}%`;

  return (
    <>
      <span
        className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-series-1 shadow-[0_0_0_3px_var(--color-raised),0_0_0_9px_color-mix(in_oklab,var(--color-series-1)_22%,transparent)]"
        style={{ left, top: `${yPct}%` }}
      />
      <span
        className={cn(
          'pointer-events-none absolute z-10 flex -translate-y-1/2 items-center gap-2.5 rounded-[16px]',
          'bg-accent py-2 pl-2 pr-4 text-accent-ink shadow-[var(--shadow-lifted)]',
          onLeft ? '-translate-x-full -ml-5' : 'ml-5',
        )}
        style={{ left, top }}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-ink/15">
          <ArrowUpIcon size={14} />
        </span>
        <span className="leading-tight">
          <span className="block text-[18px] font-normal tracking-[-0.02em] tabular">{value}</span>
          <span className="block whitespace-nowrap text-[12px] opacity-75">{caption}</span>
        </span>
      </span>
    </>
  );
}

type Pt = [number, number];

/**
 * A monotone cubic through the points (Fritsch–Carlson), so the curve never
 * overshoots between days — a smooth line that dips below zero, or bulges
 * above a day's real count, would be drawing data that does not exist.
 */
function monotonePath(pts: Pt[]): string {
  const count = pts.length;
  if (count < 2) return '';
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    dx.push(pts[i + 1]![0] - pts[i]![0]);
    m.push((pts[i + 1]![1] - pts[i]![1]) / dx[i]!);
  }

  const t: number[] = new Array(count).fill(0);
  t[0] = m[0]!;
  t[count - 1] = m[count - 2]!;
  for (let i = 1; i < count - 1; i++) {
    t[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2;
  }
  for (let i = 0; i < count - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i]! / m[i]!;
    const b = t[i + 1]! / m[i]!;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m[i]!;
      t[i + 1] = tau * b * m[i]!;
    }
  }

  let d = `M${r(pts[0]![0])},${r(pts[0]![1])}`;
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    const h = dx[i]! / 3;
    d += ` C${r(x0 + h)},${r(y0 + t[i]! * h)} ${r(x1 - h)},${r(y1 - t[i + 1]! * h)} ${r(x1)},${r(y1)}`;
  }
  return d;
}

const r = (v: number) => Math.round(v * 10) / 10;

/** Round the axis up to a number a person would write on a whiteboard. */
function niceMax(v: number): number {
  const steps = [10, 20, 30, 40, 50, 60, 80, 100, 150, 200, 300, 400, 500, 750, 1000];
  return steps.find((s) => s >= v) ?? Math.ceil(v / 500) * 500;
}

function lastIndexOf<T>(list: T[], test: (item: T) => boolean): number {
  for (let i = list.length - 1; i >= 0; i--) if (test(list[i]!)) return i;
  return -1;
}

function shortDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function longDay(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
