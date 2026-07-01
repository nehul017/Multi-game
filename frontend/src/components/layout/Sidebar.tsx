'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Gamepad2, Trophy, BarChart3, MessageSquare, Users, X } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Games', href: '/games', icon: Gamepad2 },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
  { label: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Friends', href: '/friends', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-surface/90 backdrop-blur-xl border-r border-surface-lighter/50 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-glow-purple'
                      : 'text-gray-400 hover:text-white hover:bg-surface-light'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-surface-lighter/50">
            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-primary-500/20">
              <p className="text-xs font-medium text-primary-300">Quick Play</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Find a match instantly</p>
              <Link
                href="/games"
                className="mt-2 inline-block text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                Play Now →
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
