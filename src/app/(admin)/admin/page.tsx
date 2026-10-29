import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/guards';
import { getContentStats, getOpenReports, getSuspectQuestions } from '@/lib/services/review';
import { Window, ROW, Pill } from '@/components/ui/window';
import { renderInline } from '@/lib/utils/markdown';
import { Button } from '@/components/ui/button';
import { Numeral } from '@/components/ui/bits';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminOverview() {
  await requireStaffPage();

  const [stats, reports, suspect] = await Promise.all([
    getContentStats(),
    getOpenReports(5),
    getSuspectQuestions(5),
  ]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="px-1 pb-3 pt-4 sm:pt-6">
        <h1 className="page-title">Content overview</h1>
        <p className="mt-3 text-[16px] text-muted">
          What is live, what is waiting, and what looks wrong.
        </p>
      </header>

      {/* One register, four slots — the counts line up down the row. */}
      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Published" value={stats.published} />
        <Stat label="Draft or review" value={stats.inReview} />
        <Stat label="No answer key" value={stats.awaitingKey} flagged={stats.awaitingKey > 0} />
      </div>

      {stats.awaitingKey > 0 ? (
        <Window
          tone="raised"
          title="Blocked"
          count={stats.awaitingKey}
          note="Past-paper questions without an answer key"
        >
          <p className="max-w-[68ch] text-[15px] leading-relaxed text-muted">
            These were transcribed from past papers, which were published without marking
            schemes. They cannot reach a student until a reviewer sets the key and a second
            reviewer agrees — the database will refuse to publish them.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/admin/review">Open review queue</Link>
          </Button>
        </Window>
      ) : null}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Window
          title="Student reports"
          count={reports.length > 0 ? reports.length : undefined}
          note="Open, newest first"
          bodyClassName={reports.length > 0 ? 'px-0 sm:px-0' : undefined}
        >
          {reports.length === 0 ? (
            <p className="text-[15px] text-muted">No open reports.</p>
          ) : (
            <ul className="flex flex-col">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className={`${ROW} flex items-baseline justify-between gap-3 border-t border-line-soft py-3.5 first:border-t-0`}
                >
                  {/* renderInline returns <p> blocks, so the host is a div, not a p. */}
                  <div
                    className="line-clamp-1 min-w-0 text-[15px] [&_p]:inline"
                    dangerouslySetInnerHTML={{ __html: renderInline(r.stem) }}
                  />
                  <Pill className="shrink-0">{sentence(r.reason)}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Window>

        <Window
          title="Statistically suspect"
          note="Low discrimination after 30+ attempts"
          bodyClassName={suspect.length > 0 ? 'px-0 sm:px-0' : undefined}
        >
          {suspect.length === 0 ? (
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-muted">
              Nothing flagged. This fills in once questions have been answered enough times
              — at least 30 attempts each — to measure how they discriminate.
            </p>
          ) : (
            <ul className="flex flex-col">
              {suspect.map((q) => (
                <li
                  key={q.id}
                  className={`${ROW} flex items-baseline justify-between gap-3 border-t border-line-soft py-3.5 first:border-t-0`}
                >
                  <span className="line-clamp-1 text-[15px]">{q.stem}</span>
                  <span className="shrink-0 font-mono text-[14px] leading-none text-muted tabular">
                    D = {q.discrimination?.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </div>
    </div>
  );
}

/**
 * One count. A flagged count gets a word beside it, not only a tint.
 */
function Stat({ label, value, flagged }: { label: string; value: number; flagged?: boolean }) {
  return (
    <div
      className={
        flagged
          ? 'tint-peach flex flex-col gap-4 rounded-[24px] p-5 sm:rounded-xl sm:p-6'
          : 'glass flex flex-col gap-4 rounded-[24px] p-5 sm:rounded-xl sm:p-6'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] leading-tight">{label}</p>
        {flagged ? <Pill tone="glass">Blocking</Pill> : null}
      </div>
      <Numeral value={value} slots={0} size="lg" className="self-start" />
    </div>
  );
}

/** `wrong_answer` → "Wrong answer". */
function sentence(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
