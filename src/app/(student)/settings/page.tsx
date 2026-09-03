import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUserPage } from '@/lib/auth/guards';
import { Window, Label } from '@/components/ui/window';
import { DangerZone } from './danger-zone';
import { SoundToggle } from '@/components/ui/sound-toggle';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUserPage('/settings');

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Settings</h1>
      </header>

      <Window title="Your account" bodyClassName="px-0 py-0 sm:px-0">
        <dl>
          <Row label="Name" value={user.displayName} />
          <Row label="Email" value={user.email ?? '—'} />
          <Row label="Grade" value={user.grade ? `Grade ${user.grade}` : '—'} />
        </dl>
      </Window>

      <Window title="Sound">
        <p className="max-w-prose text-[15px] leading-relaxed">
          A short note when you answer a question, and one more when you get three in
          a row. Off unless you turn it on — you might be on a bus.
        </p>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed">
          Nothing is ever only a sound. Every verdict is also a mark and a word on
          screen, so muting this loses you nothing.
        </p>
        <div className="mt-3">
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
        <p className="mt-4 text-[15px] leading-relaxed">
          That is the complete list. We do not collect your location, your device contacts,
          or your browsing outside this site, and we do not run third-party behavioural
          analytics — see our{' '}
          <Link href="/privacy" className="ant-focus underline underline-offset-2">
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
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-ink px-3 py-3 last:border-b-0 sm:px-4">
      <Label as="dt">{label}</Label>
      <dd className="text-[15px] font-semibold">{value}</dd>
    </div>
  );
}
