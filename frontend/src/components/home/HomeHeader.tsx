'use client';

import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useUIStore } from '@/store/ui.store';
import { getHomeHash, goToHomeSection, HOME_SECTION_IDS, parseHomeSection } from '@/lib/homeNav';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/games', label: 'Games' },
  { href: '/#categories', label: 'Categories' },
  { href: '/#new', label: 'New' },
  { href: '/#multiplayer', label: 'Multiplayer' },
];

type NavLink = (typeof NAV_LINKS)[number];

function HeaderNavItem({
  link,
  active,
  onClick,
  className,
  showUnderline = false,
}: {
  link: NavLink;
  active: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
  className?: string;
  showUnderline?: boolean;
}) {
  return (
    <Link
      href={link.href}
      className={cn(
        'home-nav-link home-nav-link-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
        active && 'home-nav-link-active',
        className
      )}
      aria-current={active ? 'page' : undefined}
      onClick={(event) => onClick(event, link.href)}
    >
      {link.label}
      {active && showUnderline && (
        <motion.span
          layoutId="home-nav-underline"
          className="home-nav-underline"
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      )}
    </Link>
  );
}

function isNavActive(pathname: string, href: string, section: string): boolean {
  if (href === '/games') return pathname === '/games' || pathname.startsWith('/games/');
  if (pathname !== '/') return false;
  if (href === '/') return section === '';
  return href === `/#${section}`;
}

function useActiveHomeSection(pathname: string) {
  const [section, setSection] = useState('');
  const lockRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== '/') {
      setSection('');
      return;
    }

    const initial = getHomeHash();
    setSection(initial);
    if (initial) {
      const timer = window.setTimeout(() => goToHomeSection(initial, 'replace'), 80);
      return () => window.clearTimeout(timer);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') return;

    const syncFromUrl = () => setSection(getHomeHash());
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);

    const nodes = HOME_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockRef.current !== null) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          const next = visible[0].target.id;
          setSection(next);
          return;
        }
        if (window.scrollY < 220) {
          setSection('');
        }
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: [0.12, 0.35, 0.6] }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      window.removeEventListener('hashchange', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
      observer.disconnect();
    };
  }, [pathname]);

  const activate = (next: string) => {
    lockRef.current = next;
    setSection(next);
    window.setTimeout(() => {
      if (lockRef.current === next) lockRef.current = null;
    }, 900);
  };

  return { section, activate };
}

export function HomeHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme, toggleTheme } = useUIStore();
  const { section, activate } = useActiveHomeSection(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === '/';
  const compactHeader = !isHome || scrolled || mobileOpen;

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileOpen(false);
    const next = parseHomeSection(href);
    if (next === null) return;
    if (pathname !== '/') return;
    event.preventDefault();
    activate(next);
    goToHomeSection(next);
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const syncScroll = () => setScrolled(window.scrollY > 18);
    syncScroll();
    window.addEventListener('scroll', syncScroll, { passive: true });
    return () => window.removeEventListener('scroll', syncScroll);
  }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/games?q=${encodeURIComponent(next)}` : '/games');
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const dropdownItems = [
    { label: 'Profile', icon: <User className="w-4 h-4" />, onClick: () => router.push('/profile') },
    { label: 'Settings', icon: <Settings className="w-4 h-4" />, onClick: () => router.push('/settings') },
    {
      label: 'Logout',
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleLogout,
      danger: true,
      divider: true,
    },
  ];

  const iconBtn =
    'inline-flex items-center justify-center w-11 h-11 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50';

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        compactHeader ? 'glass-nav home-header-scrolled' : 'home-header-hero'
      )}
    >
      <div className="home-container h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0" aria-label="GAMEHUB home">
          <BrandLogo size="sm" />
          <span
            className={cn(
              'font-display text-lg sm:text-xl font-bold tracking-[0.14em] text-theme-primary',
              searchOpen && 'hidden sm:inline',
              isAuthenticated && 'hidden min-[420px]:inline'
            )}
          >
            GAMEHUB
          </span>
        </Link>

        <LayoutGroup>
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <HeaderNavItem
                key={link.href}
                link={link}
                active={isNavActive(pathname, link.href, section)}
                onClick={handleNavClick}
                showUnderline
              />
            ))}
          </nav>
        </LayoutGroup>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <form
            onSubmit={handleSearch}
            className={cn('items-center', searchOpen ? 'flex' : 'hidden md:flex')}
            role="search"
          >
            <label htmlFor="home-search" className="sr-only">
              Search games
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
              <input
                id="home-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search games..."
                className="input-glass w-[min(16rem,58vw)] md:w-52 lg:w-56 pl-10 pr-3 py-2 text-sm motion-safe:transition-shadow motion-safe:duration-200 focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
          </form>

          <button
            type="button"
            className={cn(iconBtn, 'md:hidden')}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            onClick={() => setSearchOpen((open) => !open)}
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className={cn(iconBtn, 'hidden sm:inline-flex')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <>
              <Link href="/notifications" className={cn(iconBtn, 'relative')} aria-label="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[1rem] h-4 px-1 rounded-full bg-theme-danger text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-primary-500/10 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                    aria-label="Open profile menu"
                  >
                    <Avatar src={user?.avatar} name={user?.username} size="sm" online />
                  </button>
                }
                items={dropdownItems}
              />
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Join
                </Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            className={cn(iconBtn, 'lg:hidden')}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="home-mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="home-mobile-nav"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-theme"
          >
            <nav className="home-container py-4 flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <HeaderNavItem
                  key={link.href}
                  link={link}
                  active={isNavActive(pathname, link.href, section)}
                  onClick={handleNavClick}
                  className="w-full justify-start px-3 py-3 text-base"
                />
              ))}
              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-sm text-theme-muted">Appearance</span>
                <button type="button" onClick={toggleTheme} className={iconBtn} aria-label="Toggle theme">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              {!isAuthenticated && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">Join</Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
