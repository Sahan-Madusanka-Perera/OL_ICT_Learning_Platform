import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireUserPage } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { questions } from '@/lib/db/schema';
import { Window } from '@/components/ui/window';
import { ReportForm } from './report-form';
import { renderInline } from '@/lib/utils/markdown';
import { ArrowLeftIcon } from '@/components/ui/icon';

export const metadata: Metadata = { title: 'Report a question' };

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  await requireUserPage('/report');
  const { question: questionId } = await searchParams;

  if (!questionId) notFound();

  const [question] = await db
    .select({ id: questions.id, publicId: questions.publicId, stem: questions.stemMd })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (!question) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="px-1 pt-2 sm:pt-4">
        <Link
          href="/dashboard"
          className="island inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={14} />
          Back
        </Link>
        <h1 className="page-title mt-5">Report a problem</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          If something here looks wrong, tell us. Reports go straight to the review queue,
          and we would rather hear about ten that turn out to be fine than miss one that is
          not.
        </p>
      </header>

      <Window title="The question" note={<span className="font-mono">{question.publicId}</span>}>
        <div
          className="text-[15px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(question.stem) }}
        />
      </Window>

      <ReportForm questionId={question.id} />
    </div>
  );
}
