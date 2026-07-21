'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { token, isAuthenticated, isLoading } = useAuthStore();

  const hasToken =
    !!token ||
    (typeof window !== 'undefined' && !!localStorage.getItem('token'));

  useEffect(() => {
    if (!isLoading && !hasToken && !isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, hasToken, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasToken && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
