import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Window } from '@/components/ui/window';
import { SignUpForm } from './sign-up-form';

export const metadata: Metadata = { title: 'Create an account' };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect('/dashboard');

  return (
    <div>
      <Window tone="raised" title="Create your account" note="Free — no card, no ads">
        <SignUpForm />
      </Window>

      <p className="mt-6 text-center text-[15px] text-muted">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-ink underline decoration-accent-line underline-offset-4 transition-colors hover:decoration-accent">
          Sign in
        </Link>
      </p>

      <p className="mt-4 px-3 text-center text-[13px] leading-relaxed text-muted sm:px-0">
        We ask for as little as possible — a name, an email and your grade.{' '}
        <Link href="/privacy" className="text-ink underline underline-offset-4">
          What we do with it
        </Link>
        .
      </p>
    </div>
  );
}
