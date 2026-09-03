import type { Metadata } from 'next';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { syllabusNodes, questions } from '@/lib/db/schema';
import { Numeral } from '@/components/ui/bits';
import { Label } from '@/components/ui/window';
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
    <article className="mx-auto max-w-[48rem] px-3 py-12 sm:px-5 sm:py-14">
      <h1 className="font-pixel text-[24px] uppercase leading-tight sm:text-[32px]">
        What we cover
      </h1>
      <p className="mt-5 text-[17px] leading-relaxed">
        The topic structure is transcribed from the National Institute of Education
        Teacher&rsquo;s Guide and the Grade 10 and 11 textbooks — not invented. Fifteen
        units, sixty topics, and {total} published questions across them.
      </p>
      <p className="mt-3 text-[13px] leading-relaxed">
        Counts include zero. Where we have not written questions for a topic yet, this page
        says so.
      </p>

      {([10, 11] as const).map((grade) => (
        <section key={grade} className="mt-10">
          <Label as="h2">Grade {grade}</Label>

          <div className="mt-4 flex flex-col gap-2">
            {units
              .filter((u) => u.grade === grade)
              .map((unit) => {
                const topics = nodes.filter(
                  (n) => n.level === 'topic' && n.path.startsWith(`${unit.path}.`),
                );
                const n = countFor(unit.path);

                return (
                  <details key={unit.id} className="group border border-ink">
                    <summary className="ant-focus flex cursor-pointer list-none items-center gap-3 px-3 py-3 hover:bg-ink hover:text-paper sm:px-4">
                      <span className="font-pixel shrink-0 text-[16px] leading-none">
                        {unit.code}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-semibold">
                        {unit.title}
                      </span>
                      <span className="font-pixel shrink-0 text-[16px] uppercase leading-none">
                        {n > 0 ? `${n} q` : 'none yet'}
                      </span>
                      <ChevronRightIcon
                        size={12}
                        className="transition-none group-open:rotate-90"
                      />
                    </summary>

                    <ul className="border-t border-ink px-3 py-2 sm:px-4">
                      {topics.map((t) => {
                        const tn = countFor(t.path);
                        return (
                          <li key={t.id} className="flex items-baseline gap-3 py-1.5 text-[14px]">
                            <span className="font-pixel shrink-0 text-[16px] leading-none">
                              {t.code}
                            </span>
                            <span className="min-w-0 flex-1">{t.title}</span>
                            {t.periods ? (
                              <span className="font-pixel shrink-0 text-[16px] uppercase leading-none">
                                {t.periods}p
                              </span>
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

      <p className="mt-10 border-t border-ink pt-5 text-[13px] leading-relaxed">
        &ldquo;p&rdquo; is the number of teaching periods the syllabus allocates to that
        topic — we use it to weight how much practice a topic deserves.
      </p>
    </article>
  );
}
