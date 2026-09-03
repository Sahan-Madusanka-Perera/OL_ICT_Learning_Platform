import 'server-only';

import { and, eq, gte, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dailyActivity, profiles } from '@/lib/db/schema';

export type ActivityDay = {
  date: string;
  answered: number;
  correct: number;
  isToday: boolean;
  weekday: string;
};

/** The last seven days, including empty ones — gaps are information too. */
export async function getWeeklyActivity(userId: string): Promise<ActivityDay[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 6);
  const sinceStr = since.toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), gte(dailyActivity.activityDate, sinceStr)));

  const byDate = new Map(rows.map((r) => [r.activityDate, r]));
  const today = new Date().toISOString().slice(0, 10);
  const out: ActivityDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);

    out.push({
      date: key,
      answered: row?.answered ?? 0,
      correct: row?.correct ?? 0,
      isToday: key === today,
      weekday: new Intl.DateTimeFormat('en-GB', { weekday: 'narrow', timeZone: 'UTC' }).format(d),
    });
  }

  return out;
}

/**
 * Recompute the streak from daily activity.
 *
 * Run nightly. A streak survives *today* being empty — the day is not over
 * yet — but breaks on any earlier gap.
 */
export async function recomputeStreak(userId: string): Promise<{ current: number; longest: number }> {
  const rows = await db
    .select({ date: dailyActivity.activityDate, answered: dailyActivity.answered })
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId))
    .orderBy(desc(dailyActivity.activityDate));

  const active = new Set(rows.filter((r) => r.answered > 0).map((r) => r.date));

  const dayKey = (offset: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
  };

  let current = 0;
  // Today not yet practised does not break the streak; start from yesterday.
  const start = active.has(dayKey(0)) ? 0 : 1;
  for (let i = start; ; i++) {
    if (!active.has(dayKey(i))) break;
    current += 1;
  }

  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of sorted) {
    if (previous) {
      const gap = (Date.parse(date) - Date.parse(previous)) / 86_400_000;
      run = gap === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }

  await db
    .update(profiles)
    .set({ currentStreak: current, longestStreak: Math.max(longest, current) })
    .where(eq(profiles.id, userId));

  return { current, longest: Math.max(longest, current) };
}
