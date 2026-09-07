'use client';

import { motion } from 'framer-motion';
import { CHESS_BRAND } from '../brand';
import { CHESS_MODES } from '../config';
import { chessAudio } from '../audio/chessAudio';
import type { ChessPlayMode, ChessView } from '../types';

interface HubMenuProps {
  username?: string;
  rating?: number;
  onPlay: (mode: ChessPlayMode) => void;
  onOpen: (view: ChessView) => void;
  onDashboard: () => void;
}

export function HubMenu({ username, rating, onPlay, onOpen, onDashboard }: HubMenuProps) {
  return (
    <div className="cx-hub">
      <div className="cx-orbs" aria-hidden />
      <header className="cx-hub-top">
        <button type="button" className="cx-back" onClick={onDashboard}>
          ← Games
        </button>
        <div className="flex gap-2">
          <span className="cx-chip">{username || 'Player'}</span>
          <span className="cx-chip">{rating ?? 1000} rating</span>
        </div>
      </header>
      <motion.div className="cx-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="cx-kicker">Mind sport</p>
        <h1>{CHESS_BRAND.name}</h1>
        <p>{CHESS_BRAND.tagline}</p>
      </motion.div>
      <div className="cx-menu-grid">
        <button
          type="button"
          className="cx-cta"
          onClick={() => {
            chessAudio.unlock();
            chessAudio.play('click');
            onPlay('computer');
          }}
        >
          Play vs Bot
        </button>
        {CHESS_MODES.filter((m) => m.id !== 'computer').map((mode) => (
          <button
            key={mode.id}
            type="button"
            className="cx-ghost"
            onClick={() => {
              chessAudio.play('click');
              if (mode.id === 'private') onOpen('rooms');
              else onPlay(mode.id);
            }}
          >
            {mode.name}
          </button>
        ))}
        <button type="button" className="cx-ghost" onClick={() => onOpen('computer')}>
          Bot difficulty
        </button>
        <button type="button" className="cx-ghost" onClick={() => onOpen('modes')}>
          Time controls
        </button>
        <button type="button" className="cx-ghost" onClick={() => onOpen('settings')}>
          Settings
        </button>
      </div>
    </div>
  );
}
