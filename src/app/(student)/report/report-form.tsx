'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { reportQuestionAction } from '@/lib/actions/report';
import { Window, Label } from '@/components/ui/window';
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
      <Window title="Report sent">
        <p role="status" className="flex items-start gap-2.5 text-[15px] leading-relaxed">
          <CheckIcon size={12} className="mt-1" />
          {state.message}
        </p>
      </Window>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="questionId" value={questionId} />

      <Window title="What is wrong?" bodyClassName="px-0 py-0 sm:px-0">
        <fieldset>
          <legend className="sr-only-live">What is wrong?</legend>
          {REASONS.map((r) => (
            <label
              key={r.value}
              className="flex min-h-[--spacing-touch] cursor-pointer items-center gap-3 border-b border-dashed border-ink px-3 py-3 text-[15px] last:border-b-0 has-[:checked]:bg-ink has-[:checked]:text-paper sm:px-4"
            >
              <input type="radio" name="reason" value={r.value} required className="h-4 w-4" />
              {r.label}
            </label>
          ))}
        </fieldset>
      </Window>

      <Window title="Anything to add?" note="Optional" className="mt-3">
        <textarea
          name="detail"
          rows={3}
          maxLength={1000}
          aria-label="Anything to add"
          className="w-full border border-ink bg-paper px-3 py-2 text-[16px]"
          placeholder="I think the answer should be option 3, because…"
        />

        {state.message && !state.ok ? (
          <p role="alert" className="dither-25 mt-3 border border-ink px-3 py-2 text-[15px] font-semibold">
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
