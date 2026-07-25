'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Trophy,
  Flag,
  Settings,
  ShoppingBag,
  Gift,
  X,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { AppShell } from './AppShell';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Games', href: '/admin/games', icon: Gamepad2 },
  { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
  { label: 'Store', href: '/admin/store', icon: ShoppingBag },
  { label: 'Rewards', href: '/admin/rewards', icon: Gift },
  { label: 'Reports', href: '/admin/reports', icon: Flag },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {adminNavItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
              isActive ? 'nav-item-active' : 'nav-item-idle'
            )}
          >
            <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <AuthGuard>
        <AppShell>
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <Navbar />
        <div className="flex">
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'var(--overlay)' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={cn(
              'fixed left-3 lg:left-4 top-[4.75rem] z-40 h-[calc(100dvh-5.5rem)] w-[min(15.5rem,calc(100vw-1.5rem))] glass-sidebar rounded-3xl transition-transform duration-300 ease-out',
              sidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'
            )}
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-5 lg:hidden">
                <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  Admin Panel
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-5 hidden lg:block px-2">
                <h2 className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  Admin Panel
                </h2>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                <AdminNavLinks onNavigate={() => setSidebarOpen(false)} />
              </nav>
            </div>
          </aside>

          <main className="lg:pl-[17.5rem] w-full min-w-0 pt-2 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
