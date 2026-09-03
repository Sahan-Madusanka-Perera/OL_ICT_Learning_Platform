import { Skeleton, LoadingRegion } from '@/components/ui/skeleton';

/**
 * The runner's own skeleton.
 *
 * Shaped like a question so the transition into the real thing is a fill,
 * not a re-layout. The density cycling is the loading indicator; there is no
 * spinner anywhere in this product.
 */
export default function SessionLoading() {
  return (
    <LoadingRegion label="Loading your questions">
      <div className="flex min-h-dvh flex-col">
        <div className="border-b border-ink">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-3 sm:px-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl flex-1 px-0 py-4 sm:px-4 sm:py-6">
          <div className="border-y border-ink sm:border-x">
            <div className="flex h-[37px] items-center border-b border-ink px-3 sm:px-4">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="px-3 py-4 sm:px-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[--spacing-touch] w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
