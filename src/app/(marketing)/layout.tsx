import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/window';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-ink bg-paper">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-3 sm:px-5">
          <Link href="/" className="ant-focus font-pixel text-[16px] uppercase leading-none">
            O/L ICT Practice
          </Link>

          <nav className="ml-auto flex items-center gap-1.5" aria-label="Main">
            <Link
              href="/syllabus"
              className="ant-focus font-pixel hidden px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper sm:block"
            >
              Syllabus
            </Link>
            <Link
              href="/methodology"
              className="ant-focus font-pixel hidden px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper sm:block"
            >
              Method
            </Link>

            {user ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="ant-focus font-pixel px-2 py-1.5 text-[16px] uppercase leading-none hover:bg-ink hover:text-paper"
                >
                  Sign in
                </Link>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/sign-up">Start</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-ink">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-3 py-10 sm:flex-row sm:justify-between sm:px-5">
          <div className="max-w-sm">
            <Label as="p">O/L ICT Practice</Label>
            <p className="mt-3 text-[15px] leading-relaxed">
              Practice for the Sri Lankan G.C.E. Ordinary Level ICT examination, built on
              the National Institute of Education syllabus.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-10">
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/syllabus" className="ant-focus text-[15px] underline underline-offset-2">
                  Syllabus coverage
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="ant-focus text-[15px] underline underline-offset-2">
                  How we write questions
                </Link>
              </li>
            </ul>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/privacy" className="ant-focus text-[15px] underline underline-offset-2">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="ant-focus text-[15px] underline underline-offset-2">
                  Terms
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-dashed border-ink px-3 py-4 sm:px-5">
          <p className="mx-auto max-w-5xl text-[13px] leading-relaxed">
            Not affiliated with the Department of Examinations or the National Institute of
            Education. Past paper questions remain the property of their respective
            authorities.
          </p>
        </div>
      </footer>
    </div>
  );
}
