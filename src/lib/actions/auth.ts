'use server';

import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { z } from 'zod';

import { signInSchema, signUpSchema } from '@/lib/validation/auth';
import { registerAccount, authenticate } from '@/lib/services/accounts';
import { destroyCurrentSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rate-limit';

export type FormState = {
  error?: string;
  field?: string;
  values?: Record<string, string>;
};

/**
 * Only allow same-origin relative paths as a post-login destination.
 *
 * The `//` check matters: `//evil.example` is a protocol-relative URL, so a
 * naive "starts with /" test would turn the login form into an open
 * redirect. The cast is unavoidable — this value is only known at runtime,
 * which is exactly why it has to be validated here.
 */
function safeNext(next: unknown): Route {
  if (typeof next !== 'string') return '/dashboard';
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  return next as Route;
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? 'Check the form and try again.',
      field: String(issue?.path[0] ?? ''),
      values: { email: raw.email },
    };
  }

  const limit = await checkRateLimit(`signin:${parsed.data.email}`, 10, 300);
  if (!limit.allowed) {
    return { error: 'Too many attempts. Wait a few minutes and try again.', values: { email: raw.email } };
  }

  const result = await authenticate(parsed.data);
  if (!result.ok) {
    return { error: result.error, field: result.field, values: { email: raw.email } };
  }

  redirect(safeNext(formData.get('next')));
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    displayName: String(formData.get('displayName') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    grade: String(formData.get('grade') ?? '11'),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? 'Check the form and try again.',
      field: String(issue?.path[0] ?? ''),
      values: { displayName: raw.displayName, email: raw.email, grade: raw.grade },
    };
  }

  const limit = await checkRateLimit(`signup:${parsed.data.email}`, 5, 3600);
  if (!limit.allowed) {
    return { error: 'Too many sign-up attempts. Try again later.' };
  }

  const result = await registerAccount(parsed.data);
  if (!result.ok) {
    return {
      error: result.error,
      field: result.field,
      values: { displayName: raw.displayName, email: raw.email, grade: raw.grade },
    };
  }

  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect('/');
}
