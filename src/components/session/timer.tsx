'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { ClockIcon } from '@/components/ui/icon';

/**
 * Exam countdown.
 *
 * The initial value comes from the server, which owns the deadline. This
 * only displays the remaining time — editing the client clock changes what
 * the student sees, not whether their answers are accepted.
 *
 * Under five minutes the chip turns amber AND gains a clock mark AND starts
 * announcing itself politely. Colour alone would be the wrong signal to rely
 * on for the one element on screen that a student cannot afford to miss — in
 * bright sunlight on a cheap panel, an amber pill and a neutral one are very
 * nearly the same pill.
 */
export function ExamTimer({
  initialSeconds,
  onExpire,
}: {
  initialSeconds: number;
  onExpire: () => void;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const fired = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, initialSeconds - elapsed);
      setSeconds(left);

      if (left === 0 && !fired.current) {
        fired.current = true;
        clearInterval(id);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [initialSeconds, onExpire]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds <= 300;

  return (
    <div
      role="timer"
      aria-live={urgent ? 'polite' : 'off'}
      aria-label={`${minutes} minutes ${secs} seconds remaining`}
      className={cn(
        'flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5',
        'text-[14px] font-medium leading-none tabular',
        'transition-colors duration-300 ease-[var(--ease-settle)]',
        urgent
          ? 'bg-caution-soft text-caution shadow-[inset_0_0_0_1px_var(--color-caution)]'
          : 'bg-sunken text-ink',
      )}
    >
      {urgent ? <ClockIcon size={14} /> : null}
      <span aria-hidden="true">
        {minutes}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}
