'use client';

import { useState, useTransition } from 'react';
import type { ReviewQueueItem } from '@/lib/services/review';
import type { GradableQuestion } from '@/lib/services/questions';
import {
  setAnswerKeyAction,
  setExplanationAction,
  transitionQuestionAction,
} from '@/lib/actions/review';
import { Window, Pill } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/ui/source-badge';
import { StimulusFigure } from '@/components/session/stimulus-figure';
import { renderInline } from '@/lib/utils/markdown';
import { cn } from '@/lib/utils/cn';
import { CheckIcon, CrossIcon, RingIcon } from '@/components/ui/icon';

/**
 * One question in the review queue.
 *
 * The workflow is deliberately linear and blocking: you cannot approve
 * without a key, and you cannot publish a past-paper question without a
 * second approver. Those refusals come from the server, and the messages
 * they return are shown verbatim — the UI does not guess at the rules.
 */
export function ReviewCard({
  item,
  question,
  canApprove,
  canPublish,
}: {
  item: ReviewQueueItem;
  question: GradableQuestion | null;
  canApprove: boolean;
  canPublish: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(
    question?.options.find((o) => o.isCorrect)?.id ?? null,
  );
  /*
   * Start from the confidence the question already has. Defaulting to
   * "verified by reviewers" meant re-saving the key on a question matched to
   * the official scheme quietly downgraded it.
   */
  const [confidence, setConfidence] = useState<'official_key' | 'expert_verified'>(
    item.answerConfidence === 'official_key' ? 'official_key' : 'expert_verified',
  );
  const [explanation, setExplanation] = useState(item.explanation ?? '');
  const explanationDirty = explanation.trim() !== (item.explanation ?? '').trim();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  /* The seeder writes this placeholder rather than inventing a description. */
  const needsAltText = (question?.stimulus?.imageAlt ?? '').includes('Not yet described');
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await fn();
      setMessage({ ok: result.ok, text: result.message });
    });

  return (
    <Window
      title={item.publicId}
      note={`${item.topicCode} ${item.topicTitle}`}
      as="article"
    >
      {/* ---- provenance and state ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill>{sentence(item.status)}</Pill>
        {!item.hasKey ? <Pill tone="caution">No answer key</Pill> : null}
        {question ? <SourceBadge source={question.source} /> : null}
      </div>

      {/* ---- checklist ---- */}
      <ul className="mt-4 flex flex-wrap gap-2 rounded-tile bg-sunken p-2">
        <Check ok={item.hasKey} label="Answer key" />
        <Check ok={item.hasExplanation} label="Explanation" />
        <Check ok={item.answerConfidence !== 'unverified'} label="Confidence set" />
        <Check
          ok={item.approvals >= (item.sourceType === 'past_paper' ? 2 : 1)}
          label={`Approvals ${item.approvals}/${item.sourceType === 'past_paper' ? 2 : 1}`}
        />
        {question?.stimulus?.imageUrl ? (
          <Check ok={!needsAltText} label="Figure described" />
        ) : null}
      </ul>

      {/* ---- the figure, if the question has one ----
        *
        * This has to be here. A reviewer approving "Consider the following
        * logic circuit" without seeing the circuit is approving the half of
        * the question OCR happened to survive, and past-paper figures are
        * seeded precisely because that half is not the question. It is the
        * student's own figure component, so code and passages show too.
        */}
      {question?.stimulus ? (
        <StimulusFigure stimulus={question.stimulus} className="mt-4" />
      ) : null}
      {needsAltText ? (
        <p className="tint-peach mt-2 rounded-tile px-4 py-3 text-[15px] leading-relaxed">
          <strong>No alt text yet.</strong> It was extracted from the paper, not
          described — write one against the picture before publishing.
        </p>
      ) : null}

      <div
        className="prose-tight mt-5 text-[17px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderInline(item.stem) }}
      />

      {/* ---- options / key setting ---- */}
      {question ? (
        <fieldset className="mt-5">
          <legend className="mb-2.5 text-[14px] font-medium">
            {item.hasKey ? 'Answer key' : 'Set the answer key'}
          </legend>

          <div className="flex flex-col gap-2">
            {question.options.map((o) => (
              <label
                key={o.id}
                className={cn(
                  'flex min-h-13 cursor-pointer items-start gap-3 rounded-tile px-4 py-3 text-[15px] leading-relaxed',
                  'transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
                  selected === o.id
                    ? 'bg-accent text-accent-ink'
                    : 'bg-sunken shadow-[inset_0_0_0_1px_var(--color-line-soft)] hover:shadow-[inset_0_0_0_1px_var(--color-line)]',
                )}
              >
                <input
                  type="radio"
                  name={`key-${item.id}`}
                  value={o.id}
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                  className="mt-1.5 accent-current"
                />
                <span className="w-5 shrink-0 font-medium tabular">{o.label}.</span>
                <span className="min-w-0 flex-1">
                  {/* The student's own option image: an icon option is approved as seen. */}
                  {o.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={o.imageUrl}
                      alt={o.imageAlt ?? ''}
                      className="max-h-28 rounded-sm bg-[#fff] p-1"
                    />
                  ) : null}
                  <span dangerouslySetInnerHTML={{ __html: renderInline(o.content ?? '') }} />
                  {o.misconception ? (
                    <span className="mt-1.5 block text-[13px] opacity-75 [&_p]:inline">
                      Distractor note:{' '}
                      <span dangerouslySetInnerHTML={{ __html: renderInline(o.misconception) }} />
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <label className="flex flex-wrap items-center gap-2.5 text-[14px] font-medium">
              Confidence
              <select
                value={confidence}
                onChange={(e) =>
                  setConfidence(e.target.value as 'official_key' | 'expert_verified')
                }
                className="h-11 rounded-full bg-sunken px-4 text-[14px] font-normal shadow-[inset_0_0_0_1px_var(--color-line-soft)]"
              >
                <option value="expert_verified">Verified by reviewers</option>
                <option value="official_key">Matched to official marking scheme</option>
              </select>
            </label>

            <Button
              size="sm"
              variant="secondary"
              disabled={!selected || pending}
              onClick={() =>
                run(() =>
                  setAnswerKeyAction({
                    questionId: item.id,
                    correctOptionId: selected!,
                    confidence,
                  }),
                )
              }
            >
              Save answer key
            </Button>
          </div>
        </fieldset>
      ) : null}

      {/* ---- explanation ----
        *
        * Publishing refuses a question without one, so it is written here,
        * beside the key it explains, rather than somewhere else entirely.
        */}
      <div className="mt-6">
        <label htmlFor={`explanation-${item.id}`} className="text-[14px] font-medium">
          Explanation
        </label>
        <p id={`explanation-hint-${item.id}`} className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-muted">
          Why the key is right, and what choosing each wrong option usually means. Students
          see this after they answer. Needed before publishing. **bold**, `code` and a blank
          line between paragraphs all work.
        </p>
        <textarea
          id={`explanation-${item.id}`}
          aria-describedby={`explanation-hint-${item.id}`}
          rows={5}
          maxLength={5000}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Option 3 is correct because…"
          className="mt-3 block w-full resize-y rounded-tile bg-sunken px-4 py-3 text-[15px] leading-relaxed shadow-[inset_0_0_0_1px_var(--color-line-soft)] placeholder:text-faint focus:bg-raised"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            disabled={!explanationDirty || explanation.trim() === '' || pending}
            onClick={() =>
              run(() => setExplanationAction({ questionId: item.id, explanation }))
            }
          >
            {item.explanation ? 'Save explanation' : 'Add explanation'}
          </Button>
          <span className="text-[13px] text-muted" aria-live="polite">
            {explanationDirty ? 'Unsaved changes' : item.explanation ? 'Saved' : 'Not written yet'}
          </span>
        </div>
      </div>

      {/* ---- transitions ---- */}
      <div className="mt-6 flex flex-wrap gap-2 border-t border-line-soft pt-5">
        {canApprove ? (
          <Button
            size="md"
            disabled={pending}
            onClick={() =>
              run(() => transitionQuestionAction({ questionId: item.id, action: 'approve' }))
            }
          >
            Approve
          </Button>
        ) : null}

        {canPublish ? (
          <Button
            size="md"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(() => transitionQuestionAction({ questionId: item.id, action: 'publish' }))
            }
          >
            Publish
          </Button>
        ) : null}

        <Button
          size="md"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(() =>
              transitionQuestionAction({ questionId: item.id, action: 'request_changes' }),
            )
          }
        >
          Request changes
        </Button>

        {canApprove ? (
          <Button
            size="md"
            variant="danger"
            disabled={pending}
            onClick={() =>
              run(() => transitionQuestionAction({ questionId: item.id, action: 'reject' }))
            }
          >
            Reject
          </Button>
        ) : null}
      </div>

      {message ? (
        <p
          role="status"
          className={cn(
            'mt-4 flex items-start gap-2.5 rounded-tile px-4 py-3 text-[15px] font-medium',
            message.ok ? 'bg-correct-soft text-correct' : 'bg-wrong-soft text-wrong',
          )}
        >
          <span className="mt-0.5 shrink-0">
            {message.ok ? <CheckIcon size={16} /> : <CrossIcon size={16} />}
          </span>
          {message.text}
        </p>
      ) : null}
    </Window>
  );
}

/**
 * One readiness check. Done is an ink-ticked raised chip; not yet is a ring
 * on the sunken ground — shape and fill both change, not only colour.
 */
function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        'flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px]',
        ok ? 'bg-raised text-ink shadow-[var(--shadow-hairline)]' : 'text-muted',
      )}
    >
      {ok ? <CheckIcon size={14} /> : <RingIcon size={14} />}
      {label}
      <span className="sr-only">{ok ? '— done' : '— not yet'}</span>
    </li>
  );
}

/** `in_review` → "In review". */
function sentence(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
