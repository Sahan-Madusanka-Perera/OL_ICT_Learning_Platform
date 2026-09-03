import type { Metadata } from 'next';
import { requireStaffPage } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { questions, syllabusNodes, examPapers, questionStats } from '@/lib/db/schema';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/ui/source-badge';
import { assessQuestionHealth } from '@/lib/domain/scoring';
import { cn } from '@/lib/utils/cn';

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
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Questions</h1>
        <p className="mt-2 text-[15px]">{rows.length} shown</p>
      </header>

      <Window title="Filter">
        <form className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label="Search question text"
            placeholder="Search question text"
            className="h-10 min-w-[16rem] flex-1 border border-ink bg-paper px-3 text-[16px]"
          />
          <select
            name="status"
            defaultValue={status}
            aria-label="Status"
            className="font-pixel h-10 border border-ink bg-paper px-2 text-[16px] uppercase"
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
      </Window>

      {rows.length === 0 ? (
        <Window title="No questions match">
          <p className="text-[15px] leading-relaxed">
            {q
              ? `Nothing contains “${q}”. Try a shorter phrase, or clear the search.`
              : 'There are no questions with that status yet.'}
          </p>
        </Window>
      ) : (
        <Window title="Question bank" note={`${rows.length} rows`} bodyClassName="px-0 py-0 sm:px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse">
              <thead>
                <tr className="border-b border-ink text-left">
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
                      className="border-b border-dashed border-ink align-top last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 max-w-md text-[14px] leading-relaxed">{r.stem}</p>
                        <p className="font-pixel mt-1.5 text-[16px] leading-none">{r.publicId}</p>
                      </td>
                      <td className="px-4 py-3 text-[14px]">
                        <span className="font-pixel text-[16px]">{r.topicCode}</span>{' '}
                        {r.topicTitle}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="font-pixel px-4 py-3 text-[16px] uppercase leading-none">
                        {r.status.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'font-pixel border px-1.5 py-1 text-[16px] uppercase leading-none',
                            r.confidence === 'unverified'
                              ? 'dither-25 border-ink border-dashed'
                              : 'border-ink',
                          )}
                        >
                          {r.confidence === 'unverified'
                            ? 'unverified'
                            : r.confidence.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
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
    <th className="px-4 py-2.5 text-left">
      <Label as="span">{children}</Label>
    </th>
  );
}

/**
 * Question health.
 *
 * Four outcomes, four materials: solid chrome for healthy, doubled chrome
 * for suspect, dashed for the two "off-target difficulty" states, and plain
 * text where there is not enough data to say anything at all.
 */
function HealthPill({ health, attempts }: { health: string; attempts: number }) {
  if (health === 'insufficient_data') {
    return (
      <span className="font-pixel text-[16px] uppercase leading-none">{attempts} att</span>
    );
  }

  const chrome: Record<string, string> = {
    ok: 'border-ink',
    suspect: 'border-2 border-ink dither-25',
    too_easy: 'border-dashed border-ink',
    too_hard: 'border-dashed border-ink',
  };

  return (
    <span
      className={cn(
        'font-pixel inline-block whitespace-nowrap border px-1.5 py-1 text-[16px] uppercase leading-none',
        chrome[health] ?? 'border-ink',
      )}
    >
      {health.replace(/_/g, ' ')}
    </span>
  );
}
