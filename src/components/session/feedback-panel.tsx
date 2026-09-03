'use client';

import type { AnswerOutcome } from '@/lib/services/sessions';
import type { StudentQuestion } from '@/lib/services/questions';
import { AnswerConfidenceNote } from '@/components/ui/source-badge';
import { Label } from '@/components/ui/window';
import { renderInline } from '@/lib/utils/markdown';
import { cn } from '@/lib/utils/cn';
import { CheckIcon, CrossIcon } from '@/components/ui/icon';

/**
 * What turns a quiz into teaching.
 *
 * The order is deliberate: the verdict, then why the option you chose was
 * wrong, then the concept, then the exam tip. A student who picked (2) cares
 * first about why (2) was wrong — leading with the general explanation makes
 * them read past the part that addresses their actual mistake.
 *
 * This is the product's one authored moment. The window opens as a shutter
 * in six frames and the verdict mark lands inside it a beat later: one
 * gesture in two parts, the way a raster machine draws a rectangle. An
 * overshoot or a bounce here would read as a game congratulating a child —
 * wrong register for a product a parent is deciding to trust, and wrong for
 * the half of the time the verdict is "not quite".
 */
export function FeedbackPanel({
  outcome,
  question,
  className,
}: {
  outcome: AnswerOutcome;
  question: StudentQuestion;
  className?: string;
}) {
  const feedback = outcome.feedback;
  if (!feedback) return null;

  return (
    <section
      /* Announcement is handled by the runner's persistent live region —
         duplicating it here would read the verdict out twice. */
      className={cn('reveal border-y border-ink bg-paper sm:border-x', className)}
    >
      {/* ---- verdict ---- */}
      <div
        className={cn(
          'flex items-center gap-3 border-b border-ink px-3 py-2.5 sm:px-4',
          !outcome.isCorrect && 'dither-25',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'verdict-mark flex h-6 w-6 items-center justify-center border border-ink',
            outcome.isCorrect ? 'bg-ink text-paper' : 'bg-paper text-ink',
          )}
        >
          {outcome.isCorrect ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
        </span>
        <Label as="p">{outcome.isCorrect ? 'Correct' : 'Not quite'}</Label>
      </div>

      <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
        {/* the specific misconception — first, because it is the most useful */}
        {feedback.misconception ? (
          <div>
            <Label as="h3">Why your answer was wrong</Label>
            <div
              className="prose-tight mt-2 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderInline(feedback.misconception) }}
            />
          </div>
        ) : null}

        {/* the concept */}
        {feedback.explanation ? (
          <div className={cn(feedback.misconception && 'border-t border-dashed border-ink pt-4')}>
            <Label as="h3">{feedback.misconception ? 'The idea behind it' : 'Why'}</Label>
            <div
              className="prose-tight mt-2 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderInline(feedback.explanation) }}
            />
          </div>
        ) : null}

        {/* the exam tip */}
        {feedback.examTip ? (
          <div className="border-t border-dashed border-ink pt-4">
            <Label as="h3">Exam tip</Label>
            <div
              className="mt-2 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderInline(feedback.examTip) }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-3">
          <AnswerConfidenceNote confidence={feedback.answerConfidence} />
          <ReportLink questionId={question.id} publicId={question.publicId} />
        </div>
      </div>
    </section>
  );
}

/**
 * Students are the largest QA team this platform will ever have. Reporting
 * has to be one tap from the moment they notice something is wrong.
 */
function ReportLink({ questionId, publicId }: { questionId: string; publicId: string }) {
  return (
    <a
      href={`/report?question=${questionId}`}
      className="ant-focus text-[13px] underline underline-offset-2"
    >
      Something wrong with {publicId}?
    </a>
  );
}
