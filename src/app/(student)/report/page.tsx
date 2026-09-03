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
    <div className="mx-auto flex max-w-xl flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <Link
          href="/dashboard"
          className="ant-focus font-pixel inline-flex items-center gap-2 text-[16px] uppercase leading-none"
        >
          <ArrowLeftIcon size={12} />
          Back
        </Link>
        <h1 className="font-pixel mt-3 text-[24px] uppercase leading-tight">Report a problem</h1>
        <p className="mt-2 text-[15px] leading-relaxed">
          If something here looks wrong, tell us. Reports go straight to the review queue,
          and we would rather hear about ten that turn out to be fine than miss one that is
          not.
        </p>
      </header>

      <Window title="The question" note={question.publicId}>
        <div
          className="text-[15px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(question.stem) }}
        />
      </Window>

      <ReportForm questionId={question.id} />
    </div>
  );
}
