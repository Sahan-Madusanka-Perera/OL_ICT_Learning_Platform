'use client';

import { useState, useTransition } from 'react';
import type { ReviewQueueItem } from '@/lib/services/review';
import type { GradableQuestion } from '@/lib/services/questions';
import { setAnswerKeyAction, transitionQuestionAction } from '@/lib/actions/review';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/ui/source-badge';
import { renderInline } from '@/lib/utils/markdown';
import { cn } from '@/lib/utils/cn';
import { CheckIcon, RingIcon } from '@/components/ui/icon';

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
  const [confidence, setConfidence] = useState<'official_key' | 'expert_verified'>(
    'expert_verified',
  );
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
      className={cn(!item.hasKey && 'border-y-2 sm:border-x-2')}
    >
      {/* ---- provenance and state ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-pixel border border-ink px-2 py-1 text-[16px] uppercase leading-none">
          {item.status.replace(/_/g, ' ')}
        </span>
        {question ? <SourceBadge source={question.source} /> : null}
      </div>

      {/* ---- checklist ---- */}
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-dashed border-ink py-3">
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
        * seeded precisely because that half is not the question.
        */}
      {question?.stimulus?.imageUrl ? (
        <figure className="mt-4 border border-dashed border-ink p-3">
          {question.stimulus.caption ? (
            <Label as="p" className="mb-2">
              {question.stimulus.caption}
            </Label>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.stimulus.imageUrl}
            alt={question.stimulus.imageAlt ?? ''}
            className="max-w-full"
          />
          {needsAltText ? (
            <p className="mt-3 border-t border-dashed border-ink pt-2 text-[15px] leading-relaxed">
              <strong>No alt text yet.</strong> It was extracted from the paper, not
              described — write one against the picture before publishing.
            </p>
          ) : null}
        </figure>
      ) : null}

      <div
        className="mt-4 text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderInline(item.stem) }}
      />

      {/* ---- options / key setting ---- */}
      {question ? (
        <fieldset className="mt-4">
          <legend className="font-pixel mb-2 text-[16px] uppercase leading-none">
            {item.hasKey ? 'Answer key' : 'Set the answer key'}
          </legend>

          <div className="flex flex-col gap-1.5">
            {question.options.map((o) => (
              <label
                key={o.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 border px-3 py-2.5 text-[15px]',
                  selected === o.id ? 'border-ink bg-ink text-paper' : 'border-dashed border-ink',
                )}
              >
                <input
                  type="radio"
                  name={`key-${item.id}`}
                  value={o.id}
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="font-pixel text-[16px]">{o.label}.</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: renderInline(o.content ?? '') }} />
                  {o.misconception ? (
                    <span className="mt-1.5 block text-[13px]">
                      Distractor note: {o.misconception}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <label className="font-pixel flex items-center gap-2 text-[16px] uppercase leading-none">
              Confidence
              <select
                value={confidence}
                onChange={(e) =>
                  setConfidence(e.target.value as 'official_key' | 'expert_verified')
                }
                className="font-pixel h-9 border border-ink bg-paper px-2 text-[16px] uppercase"
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

      {/* ---- transitions ---- */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-ink pt-4">
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
            variant="secondary"
            className="border-dashed"
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
            'mt-3 border px-3 py-2 text-[15px] font-semibold',
            message.ok ? 'border-ink' : 'dither-25 border-2 border-ink',
          )}
        >
          {message.text}
        </p>
      ) : null}
    </Window>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckIcon size={12} /> : <RingIcon size={12} />}
      <Label as="span">{label}</Label>
    </li>
  );
}
