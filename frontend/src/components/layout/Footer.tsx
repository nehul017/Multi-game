'use client';

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="glass border-t border-theme mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-purple">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-theme-primary">MultiGame</span>
            </div>
            <p className="text-sm text-theme-muted">
              The ultimate multiplayer gaming platform. Play, compete, and connect with players worldwide.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-theme-primary mb-4">Games</h4>
            <ul className="space-y-2">
              <li><Link href="/games" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">All Games</Link></li>
              <li><Link href="/tournaments" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Tournaments</Link></li>
              <li><Link href="/leaderboard" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-theme-primary mb-4">Community</h4>
            <ul className="space-y-2">
              <li><Link href="/chat" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Chat</Link></li>
              <li><Link href="/friends" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Friends</Link></li>
              <li><Link href="#" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Discord</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-theme-primary mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-theme-muted hover:text-primary-500 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-theme text-center">
          <p className="text-sm text-theme-muted">
            &copy; {new Date().getFullYear()} MultiGame Arena. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
