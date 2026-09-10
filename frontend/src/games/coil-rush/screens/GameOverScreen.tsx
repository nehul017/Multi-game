'use client';

import { motion } from 'framer-motion';
import type { CoilRunStats } from '../types';

interface GameOverScreenProps {
  stats: CoilRunStats;
  onAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
}

const formatTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function GameOverScreen({ stats, onAgain, onHome, onLeaderboard }: GameOverScreenProps) {
  return (
    <motion.div className="coil-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.section
        className="coil-card coil-over"
        initial={{ y: 28, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
      >
        {stats.isRecord && <p className="coil-record">New record</p>}
        <p className="coil-kicker">Eliminated</p>
        <h2>You were eliminated</h2>
        <p className="coil-empty">Your coil scattered across the arena. Drop back in and take the lead.</p>
        <div className="coil-over-grid">
          <span>Score <b>{Math.floor(stats.score).toLocaleString()}</b></span>
          <span>Length <b>{stats.length}</b></span>
          <span>Rank <b>#{stats.rank || '—'}</b></span>
          <span>Survival <b>{formatTime(stats.timeMs)}</b></span>
          <span>Food <b>{stats.foodEaten}</b></span>
          <span>Cuts <b>{stats.kills}</b></span>
          {stats.coins != null && <span>Coins <b>+{stats.coins}</b></span>}
          {stats.xp != null && <span>XP <b>+{stats.xp}</b></span>}
        </div>
        <p className="coil-over-best">Best score {Math.floor(stats.bestScore).toLocaleString()}</p>
        <div className="coil-over-actions">
          <button type="button" className="coil-cta" onClick={onAgain}>Play again</button>
          <button type="button" className="coil-ghost" onClick={onHome}>Back to Games</button>
          <button type="button" className="coil-ghost" onClick={onLeaderboard}>View leaderboard</button>
        </div>
      </motion.section>
    </motion.div>
  );
}
