import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/guards';
import { signOutAction } from '@/lib/actions/auth';
import { BrandTile } from '@/components/brand';
import { AdminTabs } from '@/components/admin-nav';
import { SignOutIcon } from '@/components/ui/icon';

/**
 * The admin frame — the student app's islands, with the role on show so a
 * reviewer always knows which powers the buttons below them carry.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-30">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[120%] backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        />

        <div className="relative mx-auto flex h-20 max-w-[80rem] items-center gap-3 px-3 sm:px-5 md:h-24 lg:px-7">
          <Link
            href="/admin"
            className="pointer-events-auto flex shrink-0 items-center gap-3 rounded-tile"
            aria-label="Admin overview"
          >
            <BrandTile />
            <span className="hidden text-[15px] font-medium tracking-[-0.02em] lg:block">
              Admin
            </span>
          </Link>

          <AdminTabs className="pointer-events-auto mx-auto hidden md:block" />

          <div className="pointer-events-auto ml-auto flex items-center gap-2 md:ml-0">
            <span className="island hidden h-12 items-center rounded-full px-4 text-[13px] font-medium capitalize text-muted sm:flex">
              {user.role}
            </span>
            <Link
              href="/dashboard"
              className="island flex h-12 items-center rounded-full px-4 text-[14px] text-ink transition-colors duration-200 hover:bg-raised"
            >
              Student view
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                className="island flex h-12 w-12 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-raised hover:text-ink"
              >
                <SignOutIcon size={20} />
              </button>
            </form>
          </div>
        </div>

        <div className="pointer-events-auto relative px-3 pb-2 sm:px-5 md:hidden">
          <AdminTabs />
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-[80rem] flex-1 px-3 pb-20 pt-2 sm:px-5 lg:px-7"
      >
        {children}
      </main>
    </div>
  );
}
