import type { ActivityDay } from '@/lib/services/activity';
import { cn } from '@/lib/utils/cn';
import { Numeral } from '@/components/ui/bits';

/**
 * Seven days of practice, as seven bit columns.
 *
 * Each day is a track filled from the bottom. The count is printed above it
 * in reserved digit slots, because a chart you cannot read without comparing
 * pixel heights is decoration, not data — and here the printed number and
 * the fill are the same fact stated twice.
 *
 * Today is marked with a solid rule rather than an inversion: the viewport's
 * one inversion belongs to the action, not to a label.
 */
export function ActivityStrip({ days }: { days: ActivityDay[] }) {
  const max = Math.max(10, ...days.map((d) => d.answered));
  const total = days.reduce((sum, d) => sum + d.answered, 0);
  const activeDays = days.filter((d) => d.answered > 0).length;

  return (
    <div>
      <ul className="flex items-end justify-between gap-2" role="list">
        {days.map((day) => {
          const pct = day.answered === 0 ? 0 : Math.max(6, (day.answered / max) * 100);

          return (
            <li key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className={cn('leading-none', day.answered === 0 && 'invisible')}>
                <Numeral value={day.answered} slots={2} size="sm" />
              </span>

              <div
                className="dither-12 flex h-[72px] w-full items-end border border-ink"
                role="img"
                aria-label={`${day.date}: ${day.answered} questions answered`}
              >
                <div className="w-full bg-ink" style={{ height: `${pct}%` }} />
              </div>

              <span
                className={cn(
                  'font-pixel w-full pt-1 text-center text-[16px] uppercase leading-none',
                  day.isToday && 'border-t-2 border-ink',
                )}
              >
                {day.weekday.slice(0, 1)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-dashed border-ink pt-3 text-[14px]">
        {total === 0
          ? 'No practice yet this week.'
          : `${total} ${total === 1 ? 'question' : 'questions'} across ${activeDays} ${
              activeDays === 1 ? 'day' : 'days'
            }.`}
      </p>
    </div>
  );
}
