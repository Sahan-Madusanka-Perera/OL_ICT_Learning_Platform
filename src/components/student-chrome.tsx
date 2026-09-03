'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StudentTabs } from '@/components/student-nav';
import { StreakIcon } from '@/components/ui/icon';

/**
 * The desktop's persistent chrome.
 *
 * It disappears entirely inside a session. A phone viewport is about 640px
 * tall; two stacked sticky headers plus the action bar plus the palette
 * would spend a third of it on chrome the student cannot use, and SIGN OUT
 * would sit one tap from a live examination. A student answering a question
 * should have exactly one thing in front of them.
 */
export function StudentChrome({
  displayName,
  currentStreak,
  isStaff,
  mistakeCount,
  signOut,
}: {
  displayName: string;
  currentStreak: number;
  isStaff: boolean;
  mistakeCount: number;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  if (pathname.startsWith('/session/')) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-ink bg-paper">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-3 sm:px-4">
        <Link
          href="/dashboard"
          className="ant-focus font-pixel shrink-0 text-[16px] uppercase leading-none"
        >
          O/L ICT
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {currentStreak > 0 ? (
            <span
              className="font-pixel hidden items-center gap-1.5 border border-ink px-2 py-1 text-[16px] uppercase leading-none sm:inline-flex"
              title={`${currentStreak} days practised in a row`}
            >
              <StreakIcon size={12} />
              {currentStreak}d
            </span>
          ) : null}

          {isStaff ? (
            <Link
              href="/admin"
              className="ant-focus font-pixel px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
            >
              Admin
            </Link>
          ) : null}

          <Link
            href="/settings"
            className="ant-focus font-pixel max-w-[10rem] truncate px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
          >
            {displayName}
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="ant-focus font-pixel px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-0 sm:px-4">
        <StudentTabs mistakeCount={mistakeCount} />
      </div>
    </header>
  );
}
