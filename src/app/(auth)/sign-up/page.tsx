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
      <Window title="Create your account" note="Free">
        <p className="text-[15px] leading-relaxed">No card, no ads.</p>
        <SignUpForm />
      </Window>

      <p className="mt-5 px-3 text-center text-[15px] sm:px-0">
        Already have an account?{' '}
        <Link href="/sign-in" className="ant-focus font-semibold underline underline-offset-2">
          Sign in
        </Link>
      </p>

      <p className="mt-4 px-3 text-center text-[13px] leading-relaxed sm:px-0">
        We ask for as little as possible — a name, an email and your grade.{' '}
        <Link href="/privacy" className="ant-focus underline underline-offset-2">
          What we do with it
        </Link>
        .
      </p>
    </div>
  );
}
