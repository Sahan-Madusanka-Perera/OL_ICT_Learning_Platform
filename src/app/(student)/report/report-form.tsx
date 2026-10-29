'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { reportQuestionAction } from '@/lib/actions/report';
import { Window } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/ui/icon';

const REASONS = [
  { value: 'wrong_answer', label: 'The marked answer looks wrong' },
  { value: 'unclear_question', label: 'The question is unclear or ambiguous' },
  { value: 'bad_explanation', label: 'The explanation does not make sense' },
  { value: 'typo', label: 'There is a spelling or formatting mistake' },
  { value: 'broken_image', label: 'A picture is missing or broken' },
  { value: 'wrong_topic', label: 'It is filed under the wrong topic' },
  { value: 'other', label: 'Something else' },
] as const;

export function ReportForm({ questionId }: { questionId: string }) {
  const [state, action] = useActionState(reportQuestionAction, {});

  if (state.ok) {
    return (
      <Window tone="raised" title="Report sent">
        <p role="status" className="flex items-start gap-3 text-[15px] leading-relaxed">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-correct-soft text-correct">
            <CheckIcon size={16} />
          </span>
          {state.message}
        </p>
      </Window>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="questionId" value={questionId} />

      <Window title="What is wrong?" note="Pick the closest" bodyClassName="px-3 pb-3 sm:px-4 sm:pb-4">
        <fieldset className="flex flex-col gap-1">
          <legend className="sr-only-live">What is wrong?</legend>
          {REASONS.map((r) => (
            <label
              key={r.value}
              className="flex min-h-14 cursor-pointer items-center gap-3.5 rounded-[18px] px-3 py-3 text-[15px] transition-colors duration-200 hover:bg-sunken has-[:checked]:bg-lilac has-[:checked]:text-lilac-ink"
            >
              <input type="radio" name="reason" value={r.value} required className="h-4 w-4" />
              {r.label}
            </label>
          ))}
        </fieldset>
      </Window>

      <Window title="Anything to add?" note="Optional" className="mt-5">
        <textarea
          name="detail"
          rows={3}
          maxLength={1000}
          aria-label="Anything to add"
          className="w-full rounded-tile bg-sunken px-4 py-3 text-[16px] shadow-[inset_0_0_0_1px_var(--color-line-soft)] focus:bg-raised"
          placeholder="I think the answer should be option 3, because…"
        />

        {state.message && !state.ok ? (
          <p
            role="alert"
            className="mt-3 rounded-tile bg-wrong-soft px-4 py-3 text-[15px] font-medium text-wrong shadow-[inset_0_0_0_1px_var(--color-wrong)]"
          >
            {state.message}
          </p>
        ) : null}

        <Submit />
      </Window>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending} className="mt-4">
      {pending ? 'Sending…' : 'Send report'}
    </Button>
  );
}
