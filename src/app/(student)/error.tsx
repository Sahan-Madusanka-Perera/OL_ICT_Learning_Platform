'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Window } from '@/components/ui/window';

/**
 * The error a student actually sees.
 *
 * It names what happened and what to do, and never shows a stack trace or a
 * digest string to a fifteen-year-old. Nothing they were doing is lost —
 * answers are written to the server as they are made — and saying so is the
 * most useful sentence on the page.
 */
export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[student]', error);
  }, [error]);

  return (
    <Window title="That didn't load" className="mx-auto max-w-md">
      <p className="text-[15px] leading-relaxed">
        Something went wrong on our side. Your practice is saved — every answer is recorded
        as you make it, so nothing has been lost.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} size="md" full>
          Try again
        </Button>
        <Button asChild variant="secondary" size="md" full>
          <a href="/dashboard">Back to today</a>
        </Button>
      </div>
    </Window>
  );
}
