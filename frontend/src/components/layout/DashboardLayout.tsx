'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUIStore } from '@/store/ui.store';
import { AppShell } from './AppShell';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MaintenanceBanner } from './MaintenanceBanner';
import { useNotificationSocket } from '@/socket/hooks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { setSidebarOpen, maintenanceMode } = useUIStore();

  useNotificationSocket();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  return (
    <AuthGuard>
      <AppShell>
        <Navbar />
        <Sidebar />
        <main className="lg:pl-[17.5rem] w-full min-w-0 pt-2 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
          >
            <MaintenanceBanner visible={maintenanceMode} />
            {children}
          </motion.div>
        </main>
      </AppShell>
    </AuthGuard>
  );
}
