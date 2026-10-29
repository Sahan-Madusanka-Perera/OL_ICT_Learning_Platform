import { Skeleton, LoadingRegion } from '@/components/ui/skeleton';

/**
 * The runner's own skeleton.
 *
 * Shaped like a question so the transition into the real thing is a fill, not
 * a re-layout — which means its measurements have to track the runner's. The
 * shimmer is the loading indicator; there is no spinner anywhere in this
 * product, and under `prefers-reduced-motion` the resting surface alone still
 * says something is coming.
 */
export default function SessionLoading() {
  return (
    <LoadingRegion label="Loading your questions">
      <div className="flex min-h-dvh flex-col">
        {/* matches the runner's floating title bar */}
        <div className="mx-auto w-full max-w-3xl px-3 pt-3 sm:px-5">
          <div className="island flex h-14 items-center gap-3 rounded-full pl-2 pr-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-2 flex-1" />
            <Skeleton className="h-3.5 w-10" />
          </div>
          <div className="h-12" />
        </div>

        <div className="mx-auto w-full max-w-3xl flex-1 px-3 pt-2 sm:px-5 sm:pt-3">
          <div className="glass-raised overflow-hidden rounded-[24px] sm:rounded-xl">
            <div className="flex items-center gap-2 px-5 pt-5 sm:px-8 sm:pt-7">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="mt-7 flex flex-col gap-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-[20px]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
