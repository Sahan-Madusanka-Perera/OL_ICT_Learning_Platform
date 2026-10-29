import { cn } from '@/lib/utils/cn';

/**
 * Loading placeholders.
 *
 * These matter more here than in most products: the target device is a
 * mid-range Android on mobile data, where a round trip can take a second or
 * more. Without them the student taps and nothing happens, which reads as a
 * broken app rather than a slow one.
 *
 * The shimmer is one translated gradient on the GPU — no layout property is
 * touched — and it stops entirely under `prefers-reduced-motion`, where the
 * resting surface alone still says "something is coming".
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('shimmer rounded-full bg-sunken', className)}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('glass overflow-hidden rounded-[24px] sm:rounded-xl', className)}>
      <div className="flex flex-col gap-2 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col gap-3 px-5 pb-6 sm:px-7 sm:pb-7">
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
