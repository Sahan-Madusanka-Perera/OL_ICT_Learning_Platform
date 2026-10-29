'use client';

import type { AnswerOutcome } from '@/lib/services/sessions';
import type { StudentQuestion } from '@/lib/services/questions';
import { AnswerConfidenceNote } from '@/components/ui/source-badge';
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
 * This is the product's one authored moment. The panel settles up ten pixels
 * and the verdict mark lands inside it a beat later, both on the same weighted
 * curve: one gesture in two parts. The mark's overshoot is 4% and nothing
 * bounces — a spring here would read as a game congratulating a child, which
 * is the wrong register for a product a parent is deciding to trust, and
 * wrong for the half of the time the verdict is "not quite".
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
      className={cn(
        'glass-raised reveal overflow-hidden rounded-[24px] sm:rounded-xl',
        className,
      )}
    >
      {/* ---- verdict ---- */}
      <div
        className={cn(
          'flex items-center gap-3.5 px-5 py-4 sm:px-8',
          outcome.isCorrect ? 'bg-correct-soft' : 'bg-wrong-soft',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'verdict-mark flex h-10 w-10 items-center justify-center rounded-[13px] text-raised',
            'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22)]',
            outcome.isCorrect ? 'bg-correct' : 'bg-wrong',
          )}
        >
          {outcome.isCorrect ? <CheckIcon size={16} /> : <CrossIcon size={16} />}
        </span>
        <p
          className={cn(
            'text-[22px] leading-tight tracking-[-0.025em]',
            outcome.isCorrect ? 'text-correct' : 'text-wrong',
          )}
        >
          {outcome.isCorrect ? 'Correct' : 'Not quite'}
        </p>
      </div>

      <div className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-7">
        {/* the specific misconception — first, because it is the most useful */}
        {feedback.misconception ? (
          <div>
            <h3 className="text-[15px] font-medium tracking-[-0.01em]">Why your answer was wrong</h3>
            <div
              className="prose-tight mt-2 text-[15px] leading-relaxed text-muted"
              dangerouslySetInnerHTML={{ __html: renderInline(feedback.misconception) }}
            />
          </div>
        ) : null}

        {/* the concept */}
        {feedback.explanation ? (
          <div className={cn(feedback.misconception && 'border-t border-line-soft pt-6')}>
            <h3 className="text-[15px] font-medium tracking-[-0.01em]">
              {feedback.misconception ? 'The idea behind it' : 'Why'}
            </h3>
            <div
              className="prose-tight mt-2 text-[15px] leading-relaxed text-muted"
              dangerouslySetInnerHTML={{ __html: renderInline(feedback.explanation) }}
            />
          </div>
        ) : null}

        {/* the exam tip */}
        {feedback.examTip ? (
          <div className="tint-lilac rounded-[20px] p-5">
            <h3 className="text-[15px] font-medium tracking-[-0.01em]">Exam tip</h3>
            <div
              className="mt-2 text-[15px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderInline(feedback.examTip) }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5">
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
      className="text-[13px] text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-current"
    >
      Something wrong with {publicId}?
    </a>
  );
}
