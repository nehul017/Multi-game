'use client';

import { ReactNode, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicHomeShell } from '@/components/home/PublicHomeShell';
import { GameCardSkeleton } from '@/components/home/HomeSkeletons';
import { GamesLibrary } from '@/components/games/GamesLibrary';
import { useAuthStore } from '@/store/auth.store';

function GamesPageShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, token, isLoading } = useAuthStore();
  const hasToken =
    !!token || (typeof window !== 'undefined' && !!localStorage.getItem('token'));
  const signedIn = isAuthenticated || hasToken;

  if (isLoading && !signedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (signedIn) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <PublicHomeShell>
      <div className="home-container py-8 md:py-10">{children}</div>
    </PublicHomeShell>
  );
}

function GamesLibraryFallback() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-9 w-32 rounded-xl bg-theme-secondary" />
        <div className="h-5 w-56 rounded-lg bg-theme-secondary" />
      </div>
      <div className="home-game-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <GameCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <GamesPageShell>
      <Suspense fallback={<GamesLibraryFallback />}>
        <GamesLibrary />
      </Suspense>
    </GamesPageShell>
  );
}
