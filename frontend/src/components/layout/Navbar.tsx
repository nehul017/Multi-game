'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  MessageSquare,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
  Shield,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useChatStore } from '@/store/chat.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { CoinDisplay } from '@/components/economy/CoinDisplay';
import { useWallet } from '@/hooks';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { cn } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAdmin = user?.role === 'admin';
  const { unreadCount: notifCount } = useNotificationStore();
  const { unreadCount: chatCount } = useChatStore();
  const { toggleSidebar, theme, toggleTheme } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: walletData } = useWallet();
  const coins = walletData?.data.coins ?? user?.coins ?? 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const panelSwitchItem = isAdmin
    ? isAdminRoute
      ? {
          label: 'User Panel',
          icon: <LayoutDashboard className="w-4 h-4" />,
          onClick: () => router.push('/dashboard'),
          divider: true,
        }
      : {
          label: 'Admin Panel',
          icon: <Shield className="w-4 h-4" />,
          onClick: () => router.push('/admin'),
          divider: true,
        }
    : null;

  const dropdownItems = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => router.push('/profile') },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => router.push('/settings') },
    ...(panelSwitchItem ? [panelSwitchItem] : []),
    {
      label: 'Logout',
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleLogout,
      danger: true,
      divider: true,
    },
  ];

  const iconBtnClass =
    'relative p-2.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50';

  return (
    <nav className="sticky top-0 z-50 h-16 glass-nav">
      <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 max-w-[1600px] mx-auto">
        <div className={cn('flex items-center gap-2 sm:gap-3', searchOpen && 'hidden md:flex')}>
          <button
            onClick={toggleSidebar}
            className={cn(iconBtnClass, 'lg:hidden')}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href={isAdminRoute ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <BrandLogo size="sm" />
            </motion.div>
            <span className="font-display text-lg font-bold gradient-text hidden sm:block">
              MultiGame
            </span>
          </Link>
        </div>

        <div className={cn('flex-1 max-w-md', searchOpen ? 'block mx-0 md:mx-4' : 'hidden md:block md:mx-4')}>
          <div className="relative group flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search games, players..."
                className="input-glass w-full pl-10 sm:pl-11 pr-4 py-2.5 text-sm"
                autoFocus={searchOpen}
              />
            </div>
            {searchOpen && (
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className={cn(iconBtnClass, 'md:hidden shrink-0')}
                aria-label="Close search"
              >
                <span className="text-sm font-medium">Cancel</span>
              </button>
            )}
          </div>
        </div>

        <div className={cn('flex items-center gap-0.5 sm:gap-1.5', searchOpen && 'hidden md:flex')}>
          <CoinDisplay value={coins} size="sm" className="hidden sm:inline-flex" onClick={() => router.push('/wallet')} />

          <button
            onClick={() => setSearchOpen(true)}
            className={cn(iconBtnClass, 'md:hidden')}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={iconBtnClass}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          <Link href="/chat" className={iconBtnClass} aria-label="Messages">
            <motion.span whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <MessageSquare className="w-5 h-5" />
            </motion.span>
            {chatCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {chatCount > 9 ? '9+' : chatCount}
              </span>
            )}
          </Link>

          <Link href="/notifications" className={iconBtnClass} aria-label="Notifications">
            <motion.span
              animate={{ y: [0, 0, 0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <Bell className="w-5 h-5" />
            </motion.span>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-theme-danger rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>

          <Dropdown
            trigger={
              <button className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl hover:bg-primary-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50">
                <Avatar src={user?.avatar} name={user?.username} size="sm" online floating />
                <span className="text-sm font-medium text-theme-primary hidden md:block">
                  {user?.username}
                </span>
              </button>
            }
            items={dropdownItems}
          />
        </div>
      </div>
    </nav>
  );
}
