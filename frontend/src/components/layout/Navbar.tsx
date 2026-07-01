'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, Menu, Search, Settings, User, LogOut, Shield, Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useChatStore } from '@/store/chat.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount: notifCount } = useNotificationStore();
  const { unreadCount: chatCount } = useChatStore();
  const { toggleSidebar } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const dropdownItems = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => router.push('/profile') },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => router.push('/settings') },
    ...(user?.role === 'admin' ? [{ label: 'Admin Panel', icon: <Shield className="w-4 h-4" />, onClick: () => router.push('/admin'), divider: true }] : []),
    { label: 'Logout', icon: <LogOut className="w-4 h-4" />, onClick: handleLogout, danger: true, divider: true },
  ];

  return (
    <nav className="sticky top-0 z-40 h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-lighter/50">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gaming flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent hidden sm:block">
              MultiGame
            </span>
          </Link>
        </div>

        <div className={cn('flex-1 max-w-md mx-4', searchOpen ? 'block' : 'hidden md:block')}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search games, players..."
              className="w-full bg-background/50 border border-surface-lighter/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors md:hidden"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link
            href="/chat"
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
            {chatCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-secondary-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {chatCount > 9 ? '9+' : chatCount}
              </span>
            )}
          </Link>

          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>

          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-light transition-colors">
                <Avatar src={user?.avatar} name={user?.username} size="sm" online />
                <span className="text-sm font-medium text-gray-200 hidden md:block">
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
