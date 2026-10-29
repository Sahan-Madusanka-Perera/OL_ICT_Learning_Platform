import type { Metadata } from 'next';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { syllabusNodes, questions } from '@/lib/db/schema';
import { Numeral } from '@/components/ui/bits';
import { ChevronRightIcon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Syllabus coverage' };

/**
 * Public proof that the topic structure is the real one.
 *
 * Shows question counts per unit including zeroes — a coverage page that
 * hides its gaps is marketing, not evidence. Counts sit in reserved digit
 * slots so an empty unit reads as an empty slot rather than as absent text.
 */
export default async function SyllabusPage() {
  const nodes = await db
    .select({
      id: syllabusNodes.id,
      code: syllabusNodes.code,
      title: syllabusNodes.title,
      level: syllabusNodes.level,
      grade: syllabusNodes.grade,
      periods: syllabusNodes.periods,
      path: syllabusNodes.path,
    })
    .from(syllabusNodes)
    .where(sql`${syllabusNodes.level} IN ('unit','topic')`)
    .orderBy(asc(syllabusNodes.path));

  const counts = await db
    .select({ path: syllabusNodes.path, n: sql<number>`count(*)` })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(eq(questions.status, 'published'))
    .groupBy(syllabusNodes.path);

  const countFor = (path: string) =>
    counts.filter((c) => c.path.startsWith(path)).reduce((sum, c) => sum + Number(c.n), 0);

  const units = nodes.filter((n) => n.level === 'unit');
  const total = counts.reduce((s, c) => s + Number(c.n), 0);

  return (
    <article className="mx-auto max-w-[52rem] px-3 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-10">
      <h1 className="page-title">
        What we cover
      </h1>
      <p className="mt-5 text-[17px] leading-relaxed text-muted">
        The topic structure is transcribed from the National Institute of Education
        Teacher&rsquo;s Guide and the Grade 10 and 11 textbooks — not invented. Fifteen
        units, sixty topics, and {total} published questions across them.
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Counts include zero. Where we have not written questions for a topic yet, this page
        says so.
      </p>

      {([10, 11] as const).map((grade) => (
        <section key={grade} className="mt-10">
          <h2 className="px-1 text-[22px] leading-tight tracking-[-0.03em]">Grade {grade}</h2>

          <div className="mt-4 flex flex-col gap-2.5">
            {units
              .filter((u) => u.grade === grade)
              .map((unit) => {
                const topics = nodes.filter(
                  (n) => n.level === 'topic' && n.path.startsWith(`${unit.path}.`),
                );
                const n = countFor(unit.path);

                return (
                  <details key={unit.id} className="glass group overflow-hidden rounded-[22px]">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3.5 rounded-[22px] px-3 py-3 transition-colors duration-200 hover:bg-sunken sm:px-4 [&::-webkit-details-marker]:hidden">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-accent text-[14px] font-medium text-accent-ink tabular">
                        {unit.code}
                      </span>
                      <span className="min-w-0 flex-1 text-[16px]">{unit.title}</span>
                      <span
                        className={
                          n > 0
                            ? 'shrink-0 rounded-full bg-mint px-2.5 py-1 text-[12px] font-medium text-mint-ink tabular'
                            : 'shrink-0 rounded-full border border-dashed border-faint/60 px-2.5 py-1 text-[12px] text-muted'
                        }
                      >
                        {n > 0 ? `${n} questions` : 'none yet'}
                      </span>
                      <ChevronRightIcon
                        size={16}
                        className="shrink-0 text-faint transition-transform duration-300 ease-[var(--ease-settle)] group-open:rotate-90"
                      />
                    </summary>

                    <ul className="border-t border-line-soft px-4 py-3 sm:px-5">
                      {topics.map((t) => {
                        const tn = countFor(t.path);
                        return (
                          <li key={t.id} className="flex items-baseline gap-3 py-2 text-[14px]">
                            <span className="w-9 shrink-0 font-medium tabular">{t.code}</span>
                            <span className="min-w-0 flex-1 text-muted">{t.title}</span>
                            {t.periods ? (
                              <span className="eyebrow shrink-0 tabular">{t.periods}p</span>
                            ) : null}
                            <span className="shrink-0">
                              <Numeral value={tn} slots={2} size="sm" />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
          </div>
        </section>
      ))}

      <p className="mt-10 px-1 text-[13px] leading-relaxed text-muted">
        &ldquo;p&rdquo; is the number of teaching periods the syllabus allocates to that
        topic — we use it to weight how much practice a topic deserves.
      </p>
    </article>
  );
}
