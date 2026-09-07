'use client';

import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';
import { HomeHeader } from '@/components/home/HomeHeader';

export function PublicHomeShell({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="min-h-screen flex flex-col overflow-x-clip">
        <HomeHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </AppShell>
  );
}
