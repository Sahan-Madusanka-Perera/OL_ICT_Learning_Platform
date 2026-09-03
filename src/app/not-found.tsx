import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Window } from '@/components/ui/window';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-0 py-8 sm:px-4">
      <Window title="404" note="No such address" className="w-full max-w-md">
        <h1 className="text-[17px] font-semibold leading-relaxed">
          There&rsquo;s nothing at this address
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed">
          The page may have moved, or the link may be wrong. Your account and your progress
          are unaffected.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg" full>
            <Link href="/dashboard">Go to my dashboard</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" full>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </Window>
    </div>
  );
}
