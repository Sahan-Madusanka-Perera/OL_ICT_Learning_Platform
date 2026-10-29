'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

/* `short` is the phone label: three full labels do not fit a 320px row. */
const ITEMS = [
  { href: '/admin', label: 'Overview', short: 'Overview' },
  { href: '/admin/review', label: 'Review queue', short: 'Review' },
  { href: '/admin/questions', label: 'Questions', short: 'Questions' },
] as const;

/**
 * The admin sections, as the same pill group the student app uses — the
 * current one is the ink pill and carries `aria-current`.
 *
 * Overview matches only itself; the other two also own their sub-paths.
 */
export function AdminTabs({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className={className}>
      <ul className="island flex items-center gap-1 rounded-full p-1.5">
        {ITEMS.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex-1 sm:flex-none">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center justify-center whitespace-nowrap rounded-full px-3 sm:px-5',
                  'text-[14px] leading-none tracking-[-0.01em]',
                  'transition-[background-color,color] duration-200 ease-[var(--ease-settle)]',
                  active
                    ? 'bg-accent font-medium text-accent-ink'
                    : 'text-muted hover:bg-sunken hover:text-ink',
                )}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
