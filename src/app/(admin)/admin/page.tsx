import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/guards';
import { getContentStats, getOpenReports, getSuspectQuestions } from '@/lib/services/review';
import { Window, Label } from '@/components/ui/window';
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
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Content overview</h1>
        <p className="mt-2 text-[15px]">What is live, what is waiting, and what looks wrong.</p>
      </header>

      {/* One register, four slots — the counts line up down the row. */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Published" value={stats.published} />
        <Stat label="Draft or review" value={stats.inReview} />
        <Stat label="No answer key" value={stats.awaitingKey} flagged={stats.awaitingKey > 0} />
      </div>

      {stats.awaitingKey > 0 ? (
        <Window title="Blocked" note={`${stats.awaitingKey} without a key`} className="border-y-2 sm:border-x-2">
          <p className="text-[15px] leading-relaxed">
            These were transcribed from past papers, which were published without marking
            schemes. They cannot reach a student until a reviewer sets the key and a second
            reviewer agrees — the database will refuse to publish them.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/admin/review">Open review queue</Link>
          </Button>
        </Window>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Window title="Student reports" note={reports.length > 0 ? `${reports.length}` : undefined}>
          {reports.length === 0 ? (
            <p className="text-[15px]">No open reports.</p>
          ) : (
            <ul className="flex flex-col">
              {reports.map((r) => (
                <li key={r.id} className="border-b border-dashed border-ink py-2.5 last:border-b-0">
                  <Label>{r.reason.replace(/_/g, ' ')}</Label>
                  <p className="mt-1.5 line-clamp-1 text-[15px]">{r.stem}</p>
                </li>
              ))}
            </ul>
          )}
        </Window>

        <Window title="Statistically suspect" note="Discrimination">
          {suspect.length === 0 ? (
            <p className="text-[15px] leading-relaxed">
              Nothing flagged. This fills in once questions have been answered enough times
              — at least 30 attempts each — to measure how they discriminate.
            </p>
          ) : (
            <ul className="flex flex-col">
              {suspect.map((q) => (
                <li
                  key={q.id}
                  className="flex items-baseline justify-between gap-3 border-b border-dashed border-ink py-2.5 last:border-b-0"
                >
                  <span className="line-clamp-1 text-[15px]">{q.stem}</span>
                  <span className="font-pixel shrink-0 text-[16px] leading-none">
                    D={q.discrimination?.toFixed(2)}
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

function Stat({ label, value, flagged }: { label: string; value: number; flagged?: boolean }) {
  return (
    <div className={`border-y border-ink bg-paper sm:border-x ${flagged ? 'border-y-2 sm:border-x-2' : ''}`}>
      <div className="border-b border-ink px-3 py-2 sm:px-4">
        <Label>{label}</Label>
      </div>
      <div className="px-3 py-3 sm:px-4">
        <Numeral value={value} slots={4} size="lg" />
      </div>
    </div>
  );
}
