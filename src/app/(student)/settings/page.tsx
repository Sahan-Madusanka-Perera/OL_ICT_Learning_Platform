import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/auth/guards';
import { Window, Label, ROW } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { BookmarkIcon, SignOutIcon, ChevronRightIcon } from '@/components/ui/icon';
import { signOutAction } from '@/lib/actions/auth';
import { cn } from '@/lib/utils/cn';
import { DangerZone } from './danger-zone';
import { SoundToggle } from '@/components/ui/sound-toggle';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUserPage('/settings');

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <header className="px-1 pt-2 sm:pt-4">
        <h1 className="page-title">Settings</h1>
      </header>

      <Window
        title="Your account"
        bodyClassName="px-0 pb-2 sm:px-0 sm:pb-2"
        action={
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" size="md">
              <SignOutIcon size={16} />
              Sign out
            </Button>
          </form>
        }
      >
        <dl>
          <Row label="Name" value={user.displayName} />
          <Row label="Email" value={user.email ?? '—'} />
          <Row label="Grade" value={user.grade ? `Grade ${user.grade}` : '—'} />
        </dl>
      </Window>

      <Link
        href="/bookmarks"
        className="glass group flex items-center gap-4 rounded-[24px] px-5 py-4 transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_var(--color-rim),var(--shadow-float)] sm:rounded-xl sm:px-7 sm:py-5"
      >
        <span className="tint-lilac flex h-11 w-11 shrink-0 items-center justify-center rounded-tile">
          <BookmarkIcon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] tracking-[-0.02em]">Saved questions</span>
          <span className="block text-[13px] text-muted">Everything you bookmarked</span>
        </span>
        <ChevronRightIcon
          size={16}
          className="text-faint transition-transform duration-300 ease-[var(--ease-settle)] group-hover:translate-x-0.5"
        />
      </Link>

      <Window title="Sound" note="Off unless you turn it on">
        <p className="max-w-prose text-[15px] leading-relaxed text-muted">
          A short note when you answer a question, and one more when you get three in
          a row. Off unless you turn it on — you might be on a bus.
        </p>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-muted">
          Nothing is ever only a sound. Every verdict is also a mark and a word on
          screen, so muting this loses you nothing.
        </p>
        <div className="mt-5">
          <SoundToggle labelled />
        </div>
      </Window>

      <Window title="What we store about you" note="In plain language">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed">
          <li>The name you chose, your email, and your grade.</li>
          <li>Which questions you answered, what you picked, and when.</li>
          <li>Your mastery scores, which are calculated from those answers.</li>
          <li>Which days you practised, for the streak counter.</li>
        </ul>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          That is the complete list. We do not collect your location, your device contacts,
          or your browsing outside this site, and we do not run third-party behavioural
          analytics — see our{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy page
          </Link>
          .
        </p>
      </Window>

      <DangerZone />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 border-t border-line-soft py-4', ROW)}>
      <Label as="dt">{label}</Label>
      <dd className="min-w-0 truncate text-[15px]">{value}</dd>
    </div>
  );
}
