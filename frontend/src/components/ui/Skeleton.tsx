'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-surface-lighter/50 rounded-lg animate-pulse',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-surface-lighter/30">
      <Skeleton className="w-10 h-10 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24 ml-auto" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-surface/80 border border-surface-lighter/50 rounded-2xl overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
