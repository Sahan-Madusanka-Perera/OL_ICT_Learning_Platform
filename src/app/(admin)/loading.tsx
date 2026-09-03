import { Skeleton, SkeletonCard, LoadingRegion } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <LoadingRegion label="Loading">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
        <SkeletonCard lines={5} />
      </div>
    </LoadingRegion>
  );
}
