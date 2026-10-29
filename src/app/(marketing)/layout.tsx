import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { BrandTile } from '@/components/brand';

/**
 * The public frame: the same floating islands as the app, so a parent who
 * signs their child up lands somewhere that already looks familiar.
 */
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  const navLink =
    'flex h-11 items-center rounded-full px-5 text-[14px] text-muted ' +
    'transition-colors duration-200 hover:bg-sunken hover:text-ink';

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none sticky top-0 z-20">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[120%] backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        />
        <div className="relative mx-auto flex h-20 max-w-6xl items-center gap-3 px-3 sm:px-6 md:h-24">
          <Link href="/" className="pointer-events-auto flex items-center gap-3 rounded-tile">
            <BrandTile />
            <span className="text-[15px] font-medium tracking-[-0.02em]">O/L ICT Practice</span>
          </Link>

          <nav
            aria-label="Main"
            className="island pointer-events-auto mx-auto hidden items-center gap-1 rounded-full p-1.5 md:flex"
          >
            <Link href="/syllabus" className={navLink}>
              Syllabus
            </Link>
            <Link href="/methodology" className={navLink}>
              How we write questions
            </Link>
          </nav>

          <div className="pointer-events-auto ml-auto flex items-center gap-2 md:ml-0">
            {user ? (
              <Button asChild size="md">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="island flex h-12 items-center rounded-full px-5 text-[14px] text-ink transition-colors duration-200 hover:text-muted"
                >
                  Sign in
                </Link>
                <Button asChild size="md" className="hidden sm:inline-flex">
                  <Link href="/sign-up">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="px-3 pb-3 sm:px-6 sm:pb-6">
        <div className="glass mx-auto max-w-6xl rounded-[24px] sm:rounded-xl">
          <div className="flex flex-col gap-10 px-6 py-10 sm:flex-row sm:justify-between sm:px-10 sm:py-12">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <BrandTile size="sm" />
                <span className="text-[15px] font-medium tracking-[-0.02em]">O/L ICT Practice</span>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                Practice for the Sri Lankan G.C.E. Ordinary Level ICT examination, built on
                the National Institute of Education syllabus.
              </p>
            </div>

            <nav aria-label="Footer" className="flex gap-12">
              <ul className="flex flex-col gap-3">
                <li>
                  <Link href="/syllabus" className="text-[15px] text-muted transition-colors hover:text-ink">
                    Syllabus coverage
                  </Link>
                </li>
                <li>
                  <Link href="/methodology" className="text-[15px] text-muted transition-colors hover:text-ink">
                    How we write questions
                  </Link>
                </li>
              </ul>
              <ul className="flex flex-col gap-3">
                <li>
                  <Link href="/privacy" className="text-[15px] text-muted transition-colors hover:text-ink">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[15px] text-muted transition-colors hover:text-ink">
                    Terms
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-line-soft px-6 py-5 sm:px-10">
            <p className="text-[13px] leading-relaxed text-muted">
              Not affiliated with the Department of Examinations or the National Institute of
              Education. Past paper questions remain the property of their respective
              authorities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
