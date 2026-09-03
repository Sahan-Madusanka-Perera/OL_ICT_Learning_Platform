'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Exam countdown.
 *
 * The initial value comes from the server, which owns the deadline. This
 * only displays the remaining time — editing the client clock changes what
 * the student sees, not whether their answers are accepted.
 *
 * Under five minutes the chip doubles its chrome and takes a 25% dither
 * ground. There is no red to reach for here, and the pattern change is
 * something a colour-blind student and a student in bright sunlight both get.
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
        'font-pixel shrink-0 border border-ink px-2 py-1.5 text-[16px] leading-none',
        urgent && 'dither-25 border-2',
      )}
    >
      <span aria-hidden="true">
        {minutes}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}
