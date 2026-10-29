import { Skeleton, SkeletonCard, LoadingRegion } from '@/components/ui/skeleton';

export default function StudentLoading() {
  return (
    <LoadingRegion label="Loading">
      <div className="flex flex-col gap-6 sm:gap-8">
        <div className="px-1 pt-2 sm:pt-4">
          <Skeleton className="h-11 w-64 sm:h-14 sm:w-80" />
          <Skeleton className="mt-4 h-3 w-56" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
          <div className="flex flex-col gap-5 lg:gap-6">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={3} />
          </div>
          <div className="flex flex-col gap-5 lg:gap-6">
            <SkeletonCard lines={6} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
