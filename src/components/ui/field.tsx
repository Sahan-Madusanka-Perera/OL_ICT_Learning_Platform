'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertIcon } from '@/components/ui/icon';

/**
 * A form field with its label, hint and error wired together.
 *
 * The error is `aria-describedby`-linked and announced politely, so a screen
 * reader user hears what went wrong rather than just that something did.
 * A field in error takes a 25% dither ground and a doubled black rule — the
 * error is a change of material, not a change of hue.
 */
export function Field({
  label,
  name,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    name: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
    className: string;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="font-pixel text-[16px] uppercase leading-none">
        {label}
      </label>

      {children({
        id,
        name,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        className: cn(
          'h-12 w-full border border-ink bg-paper px-3 text-[16px] text-ink',
          error && 'dither-25 border-2',
        ),
      })}

      {hint && !error ? (
        <p id={hintId} className="text-[13px] leading-snug">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="flex items-start gap-2 text-[13px] font-semibold leading-snug">
          <AlertIcon size={12} className="mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
