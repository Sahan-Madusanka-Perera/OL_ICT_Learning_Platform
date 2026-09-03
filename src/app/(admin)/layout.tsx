import Link from 'next/link';
import { requireStaffPage } from '@/lib/auth/guards';
import { signOutAction } from '@/lib/actions/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-ink bg-paper">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-3 sm:px-5">
          <Link href="/admin" className="ant-focus font-pixel text-[16px] uppercase leading-none">
            Admin
          </Link>

          <nav aria-label="Admin" className="flex">
            <AdminLink href="/admin">Overview</AdminLink>
            <AdminLink href="/admin/review">Review queue</AdminLink>
            <AdminLink href="/admin/questions">Questions</AdminLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="font-pixel border border-ink px-2 py-1 text-[16px] uppercase leading-none">
              {user.role}
            </span>
            <Link
              href="/dashboard"
              className="ant-focus font-pixel px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
            >
              Student view
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="ant-focus font-pixel px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-0 py-3 sm:px-5 sm:py-6">
        {children}
      </main>
    </div>
  );
}

function AdminLink({
  href,
  children,
}: {
  href: '/admin' | '/admin/review' | '/admin/questions';
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="ant-focus font-pixel px-2.5 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
    >
      {children}
    </Link>
  );
}
