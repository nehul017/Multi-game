'use client';

import { motion } from 'framer-motion';
import { COIL_BRAND } from '../brand';
import { coilAudio } from '../audio/audioService';
import type { CoilView } from '../types';

interface HubMenuProps {
  username?: string;
  coins?: number;
  dailyReady?: boolean;
  onPlay: () => void;
  onOpen: (view: CoilView) => void;
  onDaily: () => void;
  onDashboard: () => void;
}

const ACTIONS: Array<{ view: CoilView | 'play'; label: string; primary?: boolean }> = [
  { view: 'play', label: 'Play now', primary: true },
  { view: 'rooms', label: 'Play with friends' },
  { view: 'modes', label: 'Modes' },
  { view: 'skins', label: 'Skins' },
  { view: 'leaderboard', label: 'Leaderboard' },
  { view: 'missions', label: 'Missions' },
  { view: 'settings', label: 'Settings' },
];

export function HubMenu({ username, coins, dailyReady, onPlay, onOpen, onDaily, onDashboard }: HubMenuProps) {
  return (
    <div className="coil-hub">
      <div className="coil-hub-orbs" aria-hidden />
      <header className="coil-hub-top">
        <button type="button" className="coil-back" onClick={onDashboard}>
          ← Dashboard
        </button>
        <div className="coil-hub-meta">
          <button type="button" className="coil-chip" onClick={() => onOpen('profile')}>
            {username || 'Rider'}
          </button>
          <span className="coil-chip">{coins ?? 0} coins</span>
        </div>
      </header>
      <motion.div className="coil-logo-wrap" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="coil-mascot" aria-hidden />
        <p className="coil-kicker">Original arena</p>
        <h1>{COIL_BRAND.name}</h1>
        <p>{COIL_BRAND.tagline}</p>
      </motion.div>
      <div className="coil-menu-grid">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.primary ? 'coil-cta' : 'coil-ghost'}
            onClick={() => {
              coilAudio.play('click');
              if (action.view === 'play') onPlay();
              else if (action.view === 'modes') onOpen('modes');
              else onOpen(action.view);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button type="button" className="coil-daily" onClick={onDaily}>
        <span>Daily surge</span>
        <b>{dailyReady ? 'Claim login reward' : 'Already claimed today'}</b>
      </button>
    </div>
  );
}
