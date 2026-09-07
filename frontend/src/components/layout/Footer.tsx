'use client';

import { MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github, Instagram, MessageCircle, Youtube } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { goToHomeSection, parseHomeSection } from '@/lib/homeNav';

const FOOTER_GROUPS = [
  {
    title: 'Games',
    links: [
      { href: '/games', label: 'All Games' },
      { href: '/#categories', label: 'Categories' },
      { href: '/#new', label: 'New Games' },
      { href: '/#multiplayer', label: 'Multiplayer' },
    ],
  },
  {
    title: 'Compete',
    links: [
      { href: '/tournaments', label: 'Tournaments' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/store', label: 'Store' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign In' },
      { href: '/register', label: 'Join' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/friends', label: 'Friends' },
    ],
  },
];

const SOCIALS = [
  { href: 'https://github.com', label: 'GitHub', icon: Github },
  { href: 'https://youtube.com', label: 'YouTube', icon: Youtube },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://discord.com', label: 'Community', icon: MessageCircle },
];

export function Footer() {
  const pathname = usePathname();

  const handleHomeLink = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const section = parseHomeSection(href);
    if (section === null) return;
    if (pathname !== '/') return;
    event.preventDefault();
    goToHomeSection(section);
  };

  return (
    <footer className="glass border-t border-theme mt-auto">
      <div className="home-container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <BrandLogo size="sm" />
              <span className="font-display text-lg font-bold tracking-[0.14em] text-theme-primary">
                GAMEHUB
              </span>
            </Link>
            <p className="text-sm text-theme-muted max-w-xs">Play. Compete. Connect.</p>
            <p className="text-sm text-theme-muted max-w-sm">
              A multiplayer arena for ranked matches, live rooms, tournaments, and friends.
            </p>
          </div>

          <nav className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8" aria-label="Footer">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-theme-primary mb-4">{group.title}</h2>
                <ul className="space-y-2">
                  {group.links.map((link) => {
                    const className =
                      'text-sm text-theme-muted hover:text-primary-400 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded';
                    return (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={(event) => handleHomeLink(event, link.href)}
                          className={className}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-theme-muted">
            &copy; {new Date().getFullYear()} GAMEHUB. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
