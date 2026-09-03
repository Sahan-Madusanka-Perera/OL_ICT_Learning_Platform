'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpAction, type FormState } from '@/lib/actions/auth';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});

  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      {state.error && !state.field ? (
        <p
          role="alert"
          className="dither-25 border-2 border-ink px-3 py-2.5 text-[15px] font-semibold"
        >
          {state.error}
        </p>
      ) : null}

      <Field
        label="What should we call you?"
        name="displayName"
        hint="A first name or nickname is fine — this is not your exam name."
        error={state.field === 'displayName' ? state.error : undefined}
      >
        {(props) => (
          <input
            {...props}
            type="text"
            autoComplete="nickname"
            required
            maxLength={40}
            defaultValue={state.values?.displayName}
          />
        )}
      </Field>

      <Field
        label="Email"
        name="email"
        error={state.field === 'email' ? state.error : undefined}
      >
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values?.email}
            placeholder="you@example.com"
          />
        )}
      </Field>

      <Field
        label="Password"
        name="password"
        hint="At least 10 characters. A short phrase is easier to remember and harder to guess."
        error={state.field === 'password' ? state.error : undefined}
      >
        {(props) => <input {...props} type="password" autoComplete="new-password" required />}
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-pixel mb-2 text-[16px] uppercase leading-none">
          Which grade are you in?
        </legend>
        <div className="grid grid-cols-2 gap-2.5">
          {[10, 11].map((grade) => (
            <label
              key={grade}
              className="font-pixel flex h-12 cursor-pointer items-center justify-center border border-ink bg-paper text-[16px] uppercase leading-none has-[:checked]:bg-ink has-[:checked]:text-paper"
            >
              <input
                type="radio"
                name="grade"
                value={grade}
                defaultChecked={(state.values?.grade ?? '11') === String(grade)}
                className="sr-only"
              />
              Grade {grade}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending} className="mt-2">
      {pending ? 'Creating your account…' : 'Create account'}
    </Button>
  );
}
