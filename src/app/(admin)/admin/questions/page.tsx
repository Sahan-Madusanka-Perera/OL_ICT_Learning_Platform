import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { questions, syllabusNodes, examPapers, questionStats } from '@/lib/db/schema';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { Window, Label, Pill } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/ui/source-badge';
import { assessQuestionHealth } from '@/lib/domain/scoring';

export const metadata: Metadata = { title: 'Questions' };

const STATUSES = ['all', 'published', 'draft', 'in_review', 'approved', 'archived'] as const;

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireStaffPage();
  const { status = 'all', q } = await searchParams;

  const conditions = [isNull(questions.deletedAt)];
  if (status !== 'all' && STATUSES.includes(status as never)) {
    conditions.push(eq(questions.status, status as 'published'));
  }
  if (q) {
    conditions.push(sql`${questions.stemMd} ILIKE ${'%' + q + '%'}`);
  }

  const rows = await db
    .select({
      id: questions.id,
      publicId: questions.publicId,
      stem: questions.stemMd,
      status: questions.status,
      difficulty: questions.difficulty,
      confidence: questions.answerConfidence,
      sourceType: questions.sourceType,
      questionNumber: questions.questionNumber,
      topicCode: syllabusNodes.code,
      topicTitle: syllabusNodes.title,
      paperYear: examPapers.year,
      paperSitting: examPapers.sitting,
      paperNo: examPapers.paperNo,
      attempts: questionStats.attempts,
      pValue: questionStats.pValue,
      discrimination: questionStats.discrimination,
    })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .leftJoin(examPapers, eq(examPapers.id, questions.paperId))
    .leftJoin(questionStats, eq(questionStats.questionId, questions.id))
    .where(and(...conditions))
    .orderBy(desc(questions.updatedAt))
    .limit(100);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="px-1 pb-3 pt-4 sm:pt-6">
        <h1 className="page-title">Questions</h1>
        <p className="mt-3 text-[16px] text-muted tabular">
          {rows.length === 100 ? 'The 100 most recently edited' : `${rows.length} shown`}
        </p>
      </header>

      <form className="glass flex flex-wrap items-center gap-2.5 rounded-[24px] p-3 sm:rounded-full sm:p-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Search question text"
          placeholder="Search question text"
          className="h-12 min-w-0 flex-[1_1_16rem] rounded-full bg-sunken px-5 text-[16px] placeholder:text-faint focus:bg-raised focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Status"
          className="h-12 flex-1 rounded-full bg-sunken px-5 text-[15px] capitalize sm:flex-none"
        >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <Button type="submit" size="md">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <Window title="No questions match">
          <p className="text-[15px] leading-relaxed text-muted">
            {q
              ? `Nothing contains “${q}”. Try a shorter phrase, or clear the search.`
              : 'There are no questions with that status yet.'}
          </p>
        </Window>
      ) : (
        <Window title="Question bank" count={rows.length} bodyClassName="px-0 pb-2 sm:px-0 sm:pb-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse">
              <thead>
                <tr className="text-left">
                  <Th>Question</Th>
                  <Th>Topic</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                  <Th>Key</Th>
                  <Th>Health</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const health = assessQuestionHealth({
                    attempts: r.attempts ?? 0,
                    pValue: r.pValue,
                    discrimination: r.discrimination,
                  });

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-line-soft align-top transition-colors duration-150 hover:bg-sunken/60"
                    >
                      <td className="py-4 pl-5 pr-4 sm:pl-7">
                        <p className="line-clamp-2 max-w-md text-[14px] leading-relaxed">{r.stem}</p>
                        <p className="mt-1.5 font-mono text-[12px] leading-none text-muted">{r.publicId}</p>
                      </td>
                      <td className="px-4 py-4 text-[14px] leading-snug">
                        <span className="font-mono text-[13px] text-muted">{r.topicCode}</span>{' '}
                        {r.topicTitle}
                      </td>
                      <td className="px-4 py-4">
                        <SourceBadge
                          source={{
                            type: r.sourceType,
                            paper:
                              r.paperYear !== null &&
                              r.paperSitting !== null &&
                              r.paperNo !== null
                                ? {
                                    year: r.paperYear,
                                    sitting: r.paperSitting,
                                    paperNo: r.paperNo,
                                  }
                                : null,
                            questionNumber: r.questionNumber,
                          }}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-[14px]">
                        {sentence(r.status)}
                      </td>
                      <td className="px-4 py-4">
                        {r.confidence === 'unverified' ? (
                          <span className="inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium leading-none text-muted outline-1 outline-dashed -outline-offset-1 outline-faint">
                            Unverified
                          </span>
                        ) : (
                          <Pill tone="glass">{sentence(r.confidence)}</Pill>
                        )}
                      </td>
                      <td className="py-4 pl-4 pr-5 sm:pr-7">
                        <HealthPill health={health} attempts={r.attempts ?? 0} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Window>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 pb-3 text-left font-normal first:pl-5 last:pr-5 sm:first:pl-7 sm:last:pr-7">
      <Label as="span">{children}</Label>
    </th>
  );
}

/**
 * Question health.
 *
 * Every outcome is a word first. Healthy is a plain pill, suspect the wrong
 * tone, the two off-target difficulty states the caution tone with a dashed
 * edge, and plain text where there is not enough data to say anything at all.
 */
function HealthPill({ health, attempts }: { health: string; attempts: number }) {
  if (health === 'insufficient_data') {
    return (
      <span className="whitespace-nowrap text-[13px] text-muted tabular">
        {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
      </span>
    );
  }

  const label = sentence(health);

  if (health === 'suspect') return <Pill tone="wrong">{label}</Pill>;
  if (health === 'too_easy' || health === 'too_hard') {
    return (
      <Pill tone="caution" className="outline-1 outline-dashed -outline-offset-1 outline-caution">
        {label}
      </Pill>
    );
  }
  return <Pill tone="glass">{label}</Pill>;
}

/** `in_review` → "In review". */
function sentence(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
