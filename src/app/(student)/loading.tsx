import { Skeleton, SkeletonCard, LoadingRegion } from '@/components/ui/skeleton';

export default function StudentLoading() {
  return (
    <LoadingRegion label="Loading">
      <div className="flex flex-col gap-3">
        <div className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2.5 h-3 w-72" />
        </div>
        <SkeletonCard lines={3} />
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    </LoadingRegion>
  );
}
