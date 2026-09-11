'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Crown, LogOut, Plus, Settings, User } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { CoinDisplay } from '@/components/economy/CoinDisplay';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useWallet } from '@/hooks';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/games', label: 'Games' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

function isActive(pathname: string, href: string) {
  if (href === '/games') return pathname === '/games' || pathname.startsWith('/games/');
  return pathname === href;
}

export function JigsawLobbyHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { data: walletData } = useWallet();
  const coins = walletData?.data.coins ?? user?.coins ?? 0;

  return (
    <header className="jw-lobby-header">
      <div className="jw-lobby-header-inner">
        <div className="jw-lobby-brand">
          <Link href="/" className="jw-lobby-logo" aria-label="GAMEHUB home">
            <BrandLogo size="sm" />
            <span>GAMEHUB</span>
          </Link>
          <span className="jw-lobby-mark" aria-hidden="true">
            <Crown className="w-3.5 h-3.5" />
            Jigsaw World
          </span>
        </div>

        <nav className="jw-lobby-nav" aria-label="Primary">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`jw-lobby-link${active ? ' is-on' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="jw-lobby-tools">
          <CoinDisplay value={coins} size="sm" onClick={() => router.push('/store')} />
          <Link href="/store" className="jw-icon-btn" aria-label="Add coins">
            <Plus className="w-4 h-4" />
          </Link>
          <Link href="/notifications" className="jw-icon-btn" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <i>{unreadCount > 9 ? '9+' : unreadCount}</i>}
          </Link>
          <Dropdown
            align="right"
            trigger={
              <button type="button" className="jw-avatar-btn" aria-label="Account menu">
                <Avatar name={user?.username || 'Player'} src={user?.avatar} size="sm" />
              </button>
            }
            items={[
              { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => router.push('/profile') },
              { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => router.push('/settings') },
              {
                label: 'Logout',
                icon: <LogOut className="w-4 h-4" />,
                onClick: () => {
                  logout();
                  router.push('/login');
                },
                danger: true,
                divider: true,
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
