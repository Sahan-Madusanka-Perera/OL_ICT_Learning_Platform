import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandTile } from '@/components/brand';

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 text-center"
    >
      <BrandTile />
      <p className="display-xl mt-8 text-[56px] text-muted" aria-hidden="true">
        404
      </p>
      <h1 className="mt-2 text-[22px] tracking-[-0.025em]">There&rsquo;s nothing at this address</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        The page may have moved, or the link may be wrong. Your account and your progress
        are unaffected.
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5 sm:flex-row">
        <Button asChild size="lg" full>
          <Link href="/dashboard">My dashboard</Link>
        </Button>
        <Button asChild variant="secondary" size="lg" full>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
