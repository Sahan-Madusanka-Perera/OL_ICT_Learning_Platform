import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, and, asc, sql } from 'drizzle-orm';
import { requireUserPage } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { syllabusNodes, nodeMastery, questions } from '@/lib/db/schema';
import { viewMastery, PRIOR_ALPHA, PRIOR_BETA } from '@/lib/domain/mastery';
import { startTopicPractice } from '@/lib/actions/practice';
import { Window } from '@/components/ui/window';
import { ButtonAffordance } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Numeral } from '@/components/ui/bits';
import { MasteryBar, MasteryValue } from '@/components/ui/mastery';
import { ArrowLeftIcon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Topic' };

/** Drill-down into one unit or topic, with its children. */
export default async function NodePage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const user = await requireUserPage(`/progress/${nodeId}`);

  const [node] = await db
    .select()
    .from(syllabusNodes)
    .where(eq(syllabusNodes.id, nodeId))
    .limit(1);

  if (!node) notFound();

  const children = await db
    .select({
      id: syllabusNodes.id,
      code: syllabusNodes.code,
      title: syllabusNodes.title,
      level: syllabusNodes.level,
      alpha: nodeMastery.alpha,
      beta: nodeMastery.beta,
      attempts: nodeMastery.attempts,
    })
    .from(syllabusNodes)
    .leftJoin(
      nodeMastery,
      and(eq(nodeMastery.syllabusNodeId, syllabusNodes.id), eq(nodeMastery.userId, user.id)),
    )
    .where(eq(syllabusNodes.parentId, node.id))
    .orderBy(asc(syllabusNodes.sortOrder));

  const [own] = await db
    .select({ alpha: nodeMastery.alpha, beta: nodeMastery.beta, attempts: nodeMastery.attempts })
    .from(nodeMastery)
    .where(and(eq(nodeMastery.syllabusNodeId, node.id), eq(nodeMastery.userId, user.id)))
    .limit(1);

  const [available] = await db
    .select({ n: sql<number>`count(*)` })
    .from(questions)
    .innerJoin(syllabusNodes, eq(syllabusNodes.id, questions.syllabusNodeId))
    .where(
      and(eq(questions.status, 'published'), sql`${syllabusNodes.path} LIKE ${node.path + '%'}`),
    );

  const view = viewMastery({
    alpha: own?.alpha ?? PRIOR_ALPHA,
    beta: own?.beta ?? PRIOR_BETA,
  });

  const availableCount = Number(available?.n ?? 0);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="px-1 pt-2 sm:pt-4">
        <Link
          href="/progress"
          className="island inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={14} />
          All progress
        </Link>
        <h1 className="page-title mt-5">
          <span className="text-muted">{node.code}</span> {node.title}
        </h1>
        {node.description ? (
          <p className="mt-3 max-w-prose text-[15px] text-muted">{node.description}</p>
        ) : null}
      </header>

      <div className="stagger grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
        <Window tone="raised" title="Your mastery" note="In this area">
          {view.percentage === null ? (
            <p className="text-[22px] font-light leading-tight tracking-[-0.025em] text-muted">
              Not measured yet
            </p>
          ) : (
            <p className="flex items-baseline gap-1.5">
              <Numeral value={view.percentage} slots={2} size="xl" />
              <span className="text-[22px] font-light text-muted">%</span>
              {view.confidence === 'low' ? (
                <span className="ml-1 text-[13px] text-muted">estimate</span>
              ) : null}
            </p>
          )}
          <MasteryBar view={view} showLabel={false} className="mt-4" />

          <div className="tint-sky mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[22px] p-5">
            <div>
              <p className="text-[13px] opacity-80">Questions available</p>
              <p className="mt-1.5">
                <Numeral value={availableCount} slots={3} size="md" />
              </p>
            </div>
            {availableCount > 0 ? (
              <form action={startTopicPractice}>
                <input type="hidden" name="nodeId" value={node.id} />
                <Button type="submit" size="lg">
                  Practise this
                  <ButtonAffordance>
                    <ArrowRightIcon size={14} />
                  </ButtonAffordance>
                </Button>
              </form>
            ) : null}
          </div>
        </Window>

        {children.length > 0 ? (
          <Window
            title={node.level === 'unit' ? 'Topics in this unit' : 'What this covers'}
            count={children.length}
            bodyClassName="px-3 pb-3 sm:px-4 sm:pb-4"
          >
            <ul className="flex flex-col gap-0.5">
              {children.map((child) => {
                const childView = viewMastery({
                  alpha: child.alpha ?? PRIOR_ALPHA,
                  beta: child.beta ?? PRIOR_BETA,
                });

                const content = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-sunken text-[13px] font-medium tabular">
                      {child.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[15px]">{child.title}</span>
                        <MasteryValue view={childView} />
                      </span>
                      <MasteryBar view={childView} showLabel={false} className="mt-2" />
                    </span>
                  </>
                );

                return (
                  <li key={child.id}>
                    {child.level === 'subtopic' ? (
                      <div className="flex items-center gap-3.5 px-2 py-3 sm:px-3">{content}</div>
                    ) : (
                      <Link
                        href={`/progress/${child.id}`}
                        className="flex items-center gap-3.5 rounded-[18px] px-2 py-3 transition-colors duration-200 hover:bg-sunken sm:px-3"
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </Window>
        ) : null}
      </div>
    </div>
  );
}
