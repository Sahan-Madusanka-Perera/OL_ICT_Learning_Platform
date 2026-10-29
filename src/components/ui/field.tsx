'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertIcon } from '@/components/ui/icon';

/**
 * A form field with its label, hint and error wired together.
 *
 * The error is `aria-describedby`-linked and announced politely, so a screen
 * reader user hears what went wrong rather than just that something did. It is
 * also carried three ways at once — a tinted ground, a coloured outline and an
 * icon beside the words — because an outline alone disappears for anyone who
 * cannot separate the red from the surface it sits on.
 *
 * The input sits inset rather than raised: a field is a hole you put something
 * into, and the inner shadow is what says so without a label.
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
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        {label}
      </label>

      {children({
        id,
        name,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        className: cn(
          'h-13 w-full rounded-tile bg-sunken px-4 text-[16px] text-ink',
          'shadow-[inset_0_0_0_1px_var(--color-line-soft)]',
          'transition-[box-shadow,background-color] duration-200 ease-[var(--ease-settle)]',
          'hover:shadow-[inset_0_0_0_1px_var(--color-line)]',
          'focus:bg-raised focus:shadow-[inset_0_0_0_1px_var(--color-accent-line)]',
          error &&
            'bg-wrong-soft shadow-[inset_0_0_0_1px_var(--color-wrong)]',
        ),
      })}

      {hint && !error ? (
        <p id={hintId} className="text-[13px] leading-snug text-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-wrong"
        >
          <AlertIcon size={14} className="mt-px shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
