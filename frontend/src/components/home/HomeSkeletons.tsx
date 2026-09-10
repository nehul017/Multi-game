import { Skeleton } from '@/components/ui/Skeleton';

export function GameCardSkeleton() {
  return (
    <div className="rounded-card overflow-hidden border border-theme bg-theme-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-3.5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function HomeHeroSkeleton() {
  return (
    <section className="relative isolate overflow-hidden min-h-[420px] md:min-h-[480px]">
      <div className="home-container grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center py-14 md:py-16">
        <div className="space-y-4 max-w-xl">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36 rounded-2xl" />
            <Skeleton className="h-12 w-36 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="hidden lg:block aspect-video rounded-card" />
      </div>
    </section>
  );
}
