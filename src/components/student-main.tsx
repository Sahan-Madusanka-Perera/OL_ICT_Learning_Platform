'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

/**
 * The signed-in content well.
 *
 * It exists as its own client component for one reason: a session has to
 * escape it. `StudentChrome` and `StudentNav` already stand down on a session
 * route, but the well around them did not, so the runner — which asks for the
 * whole screen and sizes its own sticky header, action bar and palette to the
 * viewport — was being held inside a 1024px column with the canvas showing
 * down both sides. On a desktop that read as a rendering fault; on a phone it
 * quietly stole the gutters from a layout that had already given them up.
 *
 * The layout above is a server component and cannot read the pathname, so the
 * well does it here and renders as a bare pass-through inside a session.
 */
export function StudentMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inSession = pathname.startsWith('/session/');

  if (inSession) return <>{children}</>;

  return (
    <main
      id="main"
      className={cn(
        'mx-auto w-full max-w-[76rem] flex-1',
        /* Bottom padding clears the floating nav bar plus the home indicator.
           Without it the last card on every page is permanently half-covered,
           which is the kind of thing that only shows up on a real device.
           From `md` the left padding clears the icon rail. */
        'px-3 pb-32 pt-2 sm:px-5 md:pb-20 md:pl-28 md:pr-6 lg:pl-32 lg:pr-8',
      )}
    >
      {children}
    </main>
  );
}
