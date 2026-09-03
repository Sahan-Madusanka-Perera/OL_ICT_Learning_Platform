import { cn } from '@/lib/utils/cn';

/**
 * Loading placeholders.
 *
 * These matter more here than in most products: the target device is a
 * mid-range Android on mobile data, where a round trip can take a second or
 * more. Without them the student taps and nothing happens, which reads as a
 * broken app rather than a slow one.
 *
 * Loading is density cycling — 12 → 25 → 50 → 25 — so the placeholder is
 * made of the same material as everything else, and costs no request, no
 * layout and no colour.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('dither-loading', className)} aria-hidden="true" />;
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('border-y border-ink bg-paper sm:border-x', className)}>
      <div className="flex min-h-[36px] items-center border-b border-ink px-3 py-2 sm:px-4">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="flex flex-col gap-2.5 px-3 py-4 sm:px-4">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

/** Announced politely so a screen reader hears that work is in progress. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only-live">{label}</span>
      {children}
    </div>
  );
}
