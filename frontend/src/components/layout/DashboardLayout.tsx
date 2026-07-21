'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MaintenanceBanner } from './MaintenanceBanner';
import { NotificationSync } from './NotificationSync';
import { usePlatformStatus } from '@/hooks';
import { useNotificationSocket } from '@/socket/hooks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: platformStatus } = usePlatformStatus();
  const maintenanceMode = platformStatus?.data?.maintenanceMode === true;

  useNotificationSocket();

  return (
    <AuthGuard>
      <NotificationSync />
      <div className="min-h-screen bg-background">
        <Navbar />
        <Sidebar />
        <main className="lg:pl-64 pt-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <MaintenanceBanner visible={maintenanceMode} />
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
