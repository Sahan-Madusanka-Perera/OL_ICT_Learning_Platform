'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { StudentTabs } from '@/components/student-nav';
import { StreakIcon } from '@/components/ui/icon';
import { BrandTile } from '@/components/brand';

/**
 * The persistent chrome.
 *
 * Not a bar but three islands floating over the page — the brand tile, the
 * section pills, and the student's own corner — the way the reference holds
 * its controls. Behind them a strip of frosted blur fades out downward, so
 * content scrolling underneath softens instead of colliding with the pills,
 * and the wash keeps its colour all the way to the top edge.
 *
 * The blur is the one place a backdrop filter earns its cost: the header is
 * sticky, so it is composited once rather than repainted per scrolled frame.
 *
 * It disappears entirely inside a session. A student answering a question
 * should have exactly one thing in front of them.
 */
export function StudentChrome({
  displayName,
  currentStreak,
  mistakeCount,
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
    <header className="pointer-events-none sticky top-0 z-30">
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 h-[120%] backdrop-blur-md',
          '[mask-image:linear-gradient(to_bottom,black_55%,transparent)]',
        )}
      />

      <div className="relative flex h-20 items-center gap-3 px-3 sm:px-5 md:h-24 lg:px-7">
        <Link
          href="/dashboard"
          className="pointer-events-auto flex shrink-0 items-center gap-3 rounded-tile"
          aria-label="O/L ICT Practice — today"
        >
          <BrandTile />
          <span className="hidden text-[15px] font-medium tracking-[-0.02em] lg:block">
            O/L ICT
          </span>
        </Link>

        <div className="pointer-events-auto mx-auto hidden md:block">
          <StudentTabs mistakeCount={mistakeCount} />
        </div>

        <div className="pointer-events-auto ml-auto flex items-center gap-2 md:ml-0">
          {currentStreak > 0 ? (
            <span
              className="island flex h-12 items-center gap-2 rounded-full px-4 text-[14px] text-ink"
              /* The streak is a fact, not a nudge: no flame animation, no
                 celebration, and it is simply absent on a day it would be zero. */
            >
              <StreakIcon size={16} className="text-brass" />
              <span className="font-medium tabular">{currentStreak}</span>
              <span className="text-muted">
                day{currentStreak === 1 ? '' : 's'}
                <span className="sr-only-live"> practised in a row</span>
              </span>
            </span>
          ) : null}

          <Link
            href="/settings"
            aria-label={`${displayName} — settings`}
            className={cn(
              'tint-lilac flex h-12 w-12 items-center justify-center rounded-full',
              'text-[16px] font-medium uppercase',
              'shadow-[0_0_0_3px_var(--color-raised),var(--shadow-float)]',
              'transition-transform duration-200 ease-[var(--ease-settle)] hover:scale-[1.04]',
            )}
          >
            {initials(displayName)}
          </Link>
        </div>
      </div>
    </header>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1);
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`;
}
