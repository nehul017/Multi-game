'use client';

import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface/50 border-t border-surface-lighter/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-gaming flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">MultiGame</span>
            </div>
            <p className="text-sm text-gray-400">
              The ultimate multiplayer gaming platform. Play, compete, and connect with players worldwide.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Games</h4>
            <ul className="space-y-2">
              <li><Link href="/games" className="text-sm text-gray-400 hover:text-white transition-colors">All Games</Link></li>
              <li><Link href="/tournaments" className="text-sm text-gray-400 hover:text-white transition-colors">Tournaments</Link></li>
              <li><Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white transition-colors">Leaderboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Community</h4>
            <ul className="space-y-2">
              <li><Link href="/chat" className="text-sm text-gray-400 hover:text-white transition-colors">Chat</Link></li>
              <li><Link href="/friends" className="text-sm text-gray-400 hover:text-white transition-colors">Friends</Link></li>
              <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Discord</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-lighter/30 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MultiGame Arena. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
