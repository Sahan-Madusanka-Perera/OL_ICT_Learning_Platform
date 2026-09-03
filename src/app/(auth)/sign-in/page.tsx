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
      <Window title="Welcome back">
        <p className="text-[15px] leading-relaxed">
          Sign in to pick up where you left off.
        </p>
        <SignInForm next={next} />
      </Window>

      <p className="mt-5 px-3 text-center text-[15px] sm:px-0">
        New here?{' '}
        <Link href="/sign-up" className="ant-focus font-semibold underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
