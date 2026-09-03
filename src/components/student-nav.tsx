'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { HomeIcon, PlayIcon, FlagIcon, ChartIcon } from '@/components/ui/icon';

/**
 * Primary navigation.
 *
 * A bottom bar on phones, because that is where thumbs are, and a row of
 * window tabs on larger screens. Four destinations only — a student three
 * weeks from an exam does not need a menu to explore.
 *
 * The current section is marked by a solid rule and by `aria-current`, not
 * by inversion: the viewport's one inversion is spent on the action, and a
 * navigation bar is never the action.
 */

type NavItem = {
  href: '/dashboard' | '/practice' | '/mistakes' | '/progress';
  label: string;
  icon: (props: { size?: 12 | 24 | 36 }) => React.JSX.Element;
  badge?: 'mistake';
};

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Today', icon: HomeIcon },
  { href: '/practice', label: 'Practice', icon: PlayIcon },
  { href: '/mistakes', label: 'Mistakes', icon: FlagIcon, badge: 'mistake' },
  { href: '/progress', label: 'Progress', icon: ChartIcon },
];

export function StudentNav({
  mistakeCount,
}: {
  mistakeCount: number;
  dueCount: number;
}) {
  const pathname = usePathname();

  /* A session owns the whole screen. The bottom bar would sit on top of the
     action bar on a phone, and a student mid-question has nowhere to go. */
  if (pathname.startsWith('/session/')) return null;

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badge === 'mistake' ? mistakeCount : 0;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'ant-focus font-pixel relative flex h-16 flex-col items-center justify-center gap-1.5',
                  'border-t-4 text-[16px] uppercase leading-none',
                  active ? 'border-ink' : 'border-transparent',
                )}
              >
                <Icon size={12} />
                {item.label}
                {badge > 0 ? (
                  <span className="font-pixel absolute right-[18%] top-2 border border-ink bg-paper px-1 text-[16px] leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop variant — a row of window tabs, rendered inline by pages that want it. */
export function StudentTabs({ mistakeCount }: { mistakeCount: number }) {
  const pathname = usePathname();

  if (pathname.startsWith('/session/')) return null;

  return (
    <nav aria-label="Sections" className="hidden sm:block">
      <ul className="flex">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badge === 'mistake' ? mistakeCount : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'ant-focus font-pixel -mb-px flex items-center gap-2 border-b-4 px-4 py-3',
                  'text-[16px] uppercase leading-none',
                  active ? 'border-ink' : 'border-transparent',
                )}
              >
                {item.label}
                {badge > 0 ? (
                  <span className="border border-ink px-1 leading-none">{badge}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
