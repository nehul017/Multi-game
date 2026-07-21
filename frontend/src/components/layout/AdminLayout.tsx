'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Gamepad2, Trophy, Flag, Settings, ArrowLeft } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Games', href: '/admin/games', icon: Gamepad2 },
  { label: 'Tournaments', href: '/admin/tournaments', icon: Trophy },
  { label: 'Reports', href: '/admin/reports', icon: Flag },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-surface/90 backdrop-blur-xl border-r border-surface-lighter/50 hidden lg:block">
          <div className="flex flex-col h-full p-4">
            <div className="mb-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>

            <div className="mb-4">
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Panel</h2>
            </div>

            <nav className="flex-1 space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-surface-light'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="lg:pl-64 w-full">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
