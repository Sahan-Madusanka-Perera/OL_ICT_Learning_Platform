import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, and, asc, sql } from 'drizzle-orm';
import { requireUserPage } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { syllabusNodes, nodeMastery, questions } from '@/lib/db/schema';
import { viewMastery, PRIOR_ALPHA, PRIOR_BETA } from '@/lib/domain/mastery';
import { startTopicPractice } from '@/lib/actions/practice';
import { Window, Label } from '@/components/ui/window';
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
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <Link
          href="/progress"
          className="ant-focus font-pixel inline-flex items-center gap-2 text-[16px] uppercase leading-none"
        >
          <ArrowLeftIcon size={12} />
          All progress
        </Link>
        <h1 className="font-pixel mt-3 text-[24px] uppercase leading-tight">
          {node.code} {node.title}
        </h1>
        {node.description ? <p className="mt-2 text-[15px]">{node.description}</p> : null}
      </header>

      <Window title="Your mastery">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px]">In this area</span>
          <MasteryValue view={view} />
        </div>
        <MasteryBar view={view} showLabel={false} className="mt-2" />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-dashed border-ink pt-4">
          <div>
            <Label as="p">Questions available</Label>
            <p className="mt-2">
              <Numeral value={availableCount} slots={3} size="md" />
            </p>
          </div>
          {availableCount > 0 ? (
            <form action={startTopicPractice}>
              <input type="hidden" name="nodeId" value={node.id} />
              <Button type="submit" size="lg">
                Practise this
              </Button>
            </form>
          ) : null}
        </div>
      </Window>

      {children.length > 0 ? (
        <Window
          title={node.level === 'unit' ? 'Topics in this unit' : 'What this covers'}
          note={`${children.length}`}
          bodyClassName="px-0 py-0 sm:px-0"
        >
          <ul>
            {children.map((child) => {
              const childView = viewMastery({
                alpha: child.alpha ?? PRIOR_ALPHA,
                beta: child.beta ?? PRIOR_BETA,
              });

              const content = (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px]">
                      <span className="font-pixel text-[16px]">{child.code}</span> {child.title}
                    </span>
                    <MasteryValue view={childView} />
                  </div>
                  <MasteryBar view={childView} showLabel={false} className="mt-2" />
                </>
              );

              return (
                <li key={child.id} className="border-b border-dashed border-ink last:border-b-0">
                  {child.level === 'subtopic' ? (
                    <div className="px-3 py-3 sm:px-4">{content}</div>
                  ) : (
                    <Link
                      href={`/progress/${child.id}`}
                      className="ant-focus block px-3 py-3 hover:bg-ink hover:text-paper sm:px-4"
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
  );
}
