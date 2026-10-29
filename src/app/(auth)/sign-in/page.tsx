import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Window } from '@/components/ui/window';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentUser()) redirect('/dashboard');
  const { next } = await searchParams;

  return (
    <div>
      <Window tone="raised" title="Welcome back" note="Sign in to pick up where you left off">
        <SignInForm next={next} />
      </Window>

      <p className="mt-6 text-center text-[15px] text-muted">
        New here?{' '}
        <Link href="/sign-up" className="font-medium text-ink underline decoration-accent-line underline-offset-4 transition-colors hover:decoration-accent">
          Create an account
        </Link>
      </p>
    </div>
  );
}
