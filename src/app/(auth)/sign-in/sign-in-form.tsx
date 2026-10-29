'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, type FormState } from '@/lib/actions/auth';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signInAction, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error && !state.field ? (
        <p
          role="alert"
          className="rounded-tile bg-wrong-soft px-4 py-3 text-[15px] font-medium text-wrong shadow-[inset_0_0_0_1px_var(--color-wrong)]"
        >
          {state.error}
        </p>
      ) : null}

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
        error={state.field === 'password' ? state.error : undefined}
      >
        {(props) => (
          <input {...props} type="password" autoComplete="current-password" required />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending} className="mt-2">
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}
