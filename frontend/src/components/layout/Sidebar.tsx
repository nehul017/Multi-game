'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Gamepad2,
  Trophy,
  BarChart3,
  MessageSquare,
  Users,
  X,
  Zap,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { quickPlayHref } from '@/types/home';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Games', href: '/games', icon: Gamepad2 },
  { label: 'Tournaments', href: '/tournaments', icon: Trophy },
  { label: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  { label: 'Store', href: '/store', icon: ShoppingBag },
  { label: 'Wallet', href: '/wallet', icon: Coins },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Friends', href: '/friends', icon: Users },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || Boolean(pathname?.startsWith(item.href + '/'));
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
            <motion.span
              whileHover={{ scale: 1.15, rotate: isActive ? 0 : 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
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
              User Panel
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
              User Panel
            </h2>
          </div>

          <nav className="flex-1 space-y-1.5">
            <NavLinks onNavigate={() => setSidebarOpen(false)} />
          </nav>

          <div className="mt-auto pt-4 border-t border-theme">
            <div className="px-4 py-4 rounded-2xl bg-gradient-primary/10 border border-primary-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary opacity-[0.04]" />
              <div className="relative">
                <p className="text-xs font-semibold text-primary-500 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Quick Play
                </p>
                <p className="text-[11px] text-theme-muted mt-1">Find a match instantly</p>
                <Link
                  href={quickPlayHref()}
                  onClick={() => setSidebarOpen(false)}
                  className="mt-2.5 inline-flex text-xs font-semibold text-primary-500 hover:text-primary-400 transition-colors"
                >
                  Play Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
