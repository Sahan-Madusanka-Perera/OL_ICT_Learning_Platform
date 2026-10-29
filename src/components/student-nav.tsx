'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  HomeIcon,
  PlayIcon,
  FlagIcon,
  ChartIcon,
  BookmarkIcon,
  SettingsIcon,
  ShieldIcon,
  SignOutIcon,
} from '@/components/ui/icon';

/**
 * Navigation, in three forms that share one list.
 *
 *  - Phones: a floating pill bar at the bottom, where thumbs are. It floats
 *    clear of the edge so its controls sit above the home indicator and the
 *    browser's gesture strip instead of losing their bottom row to both.
 *  - Tablet and up: the same four destinations as a pill group centred in the
 *    header — the reference's tab row, with the current one as the ink pill.
 *  - Tablet and up: a slim icon rail on the left for the places a student
 *    visits less often — saved questions, settings, admin, signing out — so
 *    they are one click away without crowding the four that matter.
 *
 * The current section is marked by the ink pill and by `aria-current`. Four
 * destinations only — a student three weeks from an exam does not need a menu
 * to explore.
 */

type NavItem = {
  href: '/dashboard' | '/practice' | '/mistakes' | '/progress';
  label: string;
  icon: (props: { size?: 12 | 14 | 16 | 20 | 24 | 28 | 36 }) => React.JSX.Element;
  badge?: 'mistake';
};

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Today', icon: HomeIcon },
  { href: '/practice', label: 'Practice', icon: PlayIcon },
  { href: '/mistakes', label: 'Mistakes', icon: FlagIcon, badge: 'mistake' },
  { href: '/progress', label: 'Progress', icon: ChartIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Phones — the floating bottom bar. */
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
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="island mx-auto flex max-w-md items-center gap-1 rounded-full p-1.5">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const badge = item.badge === 'mistake' ? mistakeCount : 0;
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-full',
                  'text-[12px] font-medium leading-none',
                  'transition-[background-color,color] duration-200 ease-[var(--ease-settle)]',
                  active ? 'bg-accent text-accent-ink' : 'text-muted active:bg-sunken',
                )}
              >
                <Icon size={20} />
                {item.label}
                {badge > 0 ? (
                  <span
                    className={cn(
                      'absolute right-2 top-1.5 min-w-[18px] rounded-full px-1 py-0.5',
                      'text-[12px] font-medium leading-none tabular',
                      active ? 'bg-accent-ink text-accent' : 'bg-wrong text-raised',
                    )}
                  >
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

/** Tablet and up — the centred pill group in the header. */
export function StudentTabs({ mistakeCount }: { mistakeCount: number }) {
  const pathname = usePathname();

  if (pathname.startsWith('/session/')) return null;

  return (
    <nav aria-label="Sections">
      <ul className="island flex items-center gap-1 rounded-full p-1.5">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const badge = item.badge === 'mistake' ? mistakeCount : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center gap-2 rounded-full px-5',
                  'text-[14px] leading-none tracking-[-0.01em]',
                  'transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-settle)]',
                  active
                    ? 'bg-accent font-medium text-accent-ink shadow-[0_8px_20px_-10px_var(--shade-strong)]'
                    : 'text-muted hover:bg-sunken hover:text-ink',
                )}
              >
                {item.label}
                {badge > 0 ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[12px] font-medium leading-none tabular',
                      active ? 'bg-accent-ink/20 text-accent-ink' : 'bg-wrong-soft text-wrong',
                    )}
                  >
                    {badge}
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

/**
 * Tablet and up — the icon rail.
 *
 * Every icon carries its name as a tooltip on hover and on keyboard focus,
 * and as its accessible label; a row of glyphs nobody can name is a puzzle,
 * not a menu.
 */
export function StudentRail({
  isStaff,
  signOut,
}: {
  isStaff: boolean;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  if (pathname.startsWith('/session/')) return null;

  return (
    <nav
      aria-label="More"
      className="fixed left-5 top-1/2 z-20 hidden -translate-y-1/2 md:block lg:left-7"
    >
      <ul className="island flex flex-col items-center gap-1.5 rounded-full p-2">
        <RailLink
          href="/bookmarks"
          label="Saved questions"
          active={isActive(pathname, '/bookmarks')}
        >
          <BookmarkIcon size={20} />
        </RailLink>
        <RailLink href="/settings" label="Settings" active={isActive(pathname, '/settings')}>
          <SettingsIcon size={20} />
        </RailLink>
        {isStaff ? (
          <RailLink href="/admin" label="Admin" active={false}>
            <ShieldIcon size={20} />
          </RailLink>
        ) : null}

        <li aria-hidden="true" className="my-1 h-px w-6 bg-line" />

        <li>
          <form action={signOut}>
            <button type="submit" aria-label="Sign out" className={railClass(false)}>
              <SignOutIcon size={20} />
              <RailTip>Sign out</RailTip>
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

function railClass(active: boolean) {
  return cn(
    'group relative flex h-12 w-12 items-center justify-center rounded-tile',
    'transition-[background-color,color] duration-200 ease-[var(--ease-settle)]',
    active ? 'bg-accent text-accent-ink' : 'text-muted hover:bg-sunken hover:text-ink',
  );
}

function RailLink({
  href,
  label,
  active,
  children,
}: {
  href: '/bookmarks' | '/settings' | '/admin';
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={railClass(active)}
      >
        {children}
        <RailTip>{label}</RailTip>
      </Link>
    </li>
  );
}

function RailTip({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 -translate-x-1',
        'whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-ink',
        'opacity-0 shadow-[var(--shadow-float)]',
        'transition-[opacity,transform] duration-200 ease-[var(--ease-settle)]',
        'group-hover:translate-x-0 group-hover:opacity-100',
        'group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
      )}
    >
      {children}
    </span>
  );
}
