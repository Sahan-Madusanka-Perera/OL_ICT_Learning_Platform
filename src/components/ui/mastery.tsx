import { cn } from '@/lib/utils/cn';
import type { MasteryView } from '@/lib/domain/mastery';
import { BitStrip, UnmeasuredStrip, Numeral } from '@/components/ui/bits';
import { TrendUpIcon, TrendDownIcon, TrendFlatIcon } from '@/components/ui/icon';

/**
 * Mastery display.
 *
 * The important behaviour is the `confidence === 'none'` branch: with too
 * little evidence we show NO percentage at all rather than a flattering
 * guess. A bar reading 100% after two questions is the most likely way this
 * product could quietly mislead a student about how ready they are.
 *
 * This world helps: the unmeasured state gets its own pattern (12% dither,
 * dashed chrome) rather than a bar drawn at zero, so "not measured" and
 * "measured at nothing" can never look like each other.
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
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px]">{label}</span>
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
    return (
      <span className="font-pixel shrink-0 text-[16px] uppercase leading-none">
        No reading yet
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-baseline gap-2">
      <span className="font-pixel text-[16px] leading-none">
        <Numeral value={view.percentage} slots={3} size="sm" />%
      </span>
      {view.confidence === 'low' ? (
        <span className="font-pixel text-[16px] uppercase leading-none">est</span>
      ) : null}
    </span>
  );
}

/**
 * Trend.
 *
 * Direction is carried by the mark and the word. There is no colour to lean
 * on here, which is the point — it was never safe to lean on one.
 */
export function TrendPill({ trend, delta }: { trend: string; delta: number }) {
  if (trend === 'unknown') return null;

  const config =
    {
      improving: { label: 'Improving', Icon: TrendUpIcon },
      slipping: { label: 'Slipping', Icon: TrendDownIcon },
      steady: { label: 'Steady', Icon: TrendFlatIcon },
    }[trend] ?? { label: 'Steady', Icon: TrendFlatIcon };

  const { Icon } = config;

  return (
    <span className="font-pixel inline-flex items-center gap-1.5 border border-ink px-2 py-1 text-[16px] uppercase leading-none">
      <Icon size={12} />
      {config.label}
      {Math.abs(delta) > 0.01 ? (
        <span>
          {delta > 0 ? '+' : '-'}
          {Math.abs(Math.round(delta * 100))}%
        </span>
      ) : null}
    </span>
  );
}
