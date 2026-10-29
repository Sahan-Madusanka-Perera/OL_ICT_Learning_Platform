import { cn } from '@/lib/utils/cn';
import type { MasteryView } from '@/lib/domain/mastery';
import { BitStrip, UnmeasuredStrip } from '@/components/ui/bits';
import { Pill } from '@/components/ui/window';
import { TrendUpIcon, TrendDownIcon, TrendFlatIcon } from '@/components/ui/icon';

/**
 * Mastery display.
 *
 * The important behaviour is the `confidence === 'none'` branch: with too
 * little evidence we show NO percentage at all rather than a flattering guess.
 * A bar reading 100% after two questions is the most likely way this product
 * could quietly mislead a student about how ready they are.
 *
 * The visual system has to carry that, not just the logic. Unmeasured gets a
 * dashed outline with nothing inside; an early estimate gets a filled meter
 * with a hatched tail standing for the range still open. Three states that
 * cannot be mistaken for one another at a glance.
 */

const CELLS = 20;

export function MasteryBar({
  view,
  label,
  className,
  showLabel = true,
}: {
  view: MasteryView;
  label?: string;
  className?: string;
  showLabel?: boolean;
}) {
  const name = label ?? 'Topic';

  return (
    <div className={cn('min-w-0', className)}>
      {showLabel && label ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px] text-ink">{label}</span>
          <MasteryValue view={view} />
        </div>
      ) : null}

      {view.confidence === 'none' ? (
        <UnmeasuredStrip label={`${name}: not enough practice yet to measure`} />
      ) : (
        <BitStrip
          filled={view.mastery * CELLS}
          total={CELLS}
          soft={view.confidence === 'low'}
          tone={view.mastery >= 0.75 ? 'correct' : view.mastery >= 0.4 ? 'accent' : 'caution'}
          label={`${name}: ${view.percentage}% mastery, ${view.label}${
            view.confidence === 'low' ? ', early estimate' : ''
          }`}
        />
      )}
    </div>
  );
}

export function MasteryValue({ view }: { view: MasteryView }) {
  if (view.percentage === null) {
    return <span className="shrink-0 text-[13px] text-muted">Not measured yet</span>;
  }

  return (
    <span className="flex shrink-0 items-baseline gap-2">
      <span className="text-[16px] font-medium tracking-[-0.01em] tabular">{view.percentage}%</span>
      {view.confidence === 'low' ? (
        <span className="text-[12px] text-muted">estimate</span>
      ) : null}
    </span>
  );
}

/**
 * Trend.
 *
 * Direction is carried by the mark and the word first; the colour is the third
 * signal, never the only one. "Slipping" in amber with a falling arrow survives
 * a monochrome screen, a colour-blind reader, and a phone in direct sunlight.
 */
export function TrendPill({ trend, delta }: { trend: string; delta: number }) {
  if (trend === 'unknown') return null;

  const config =
    {
      improving: { label: 'Improving', Icon: TrendUpIcon, tone: 'correct' as const },
      slipping: { label: 'Slipping', Icon: TrendDownIcon, tone: 'caution' as const },
      steady: { label: 'Steady', Icon: TrendFlatIcon, tone: 'neutral' as const },
    }[trend] ?? { label: 'Steady', Icon: TrendFlatIcon, tone: 'neutral' as const };

  const { Icon } = config;

  return (
    <Pill tone={config.tone}>
      <Icon size={14} />
      {config.label}
      {Math.abs(delta) > 0.01 ? (
        <span className="tabular">
          {delta > 0 ? '+' : '−'}
          {Math.abs(Math.round(delta * 100))}%
        </span>
      ) : null}
    </Pill>
  );
}
