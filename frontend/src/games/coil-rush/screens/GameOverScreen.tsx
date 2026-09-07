'use client';

import { motion } from 'framer-motion';
import type { CoilRunStats } from '../types';

interface GameOverScreenProps {
  stats: CoilRunStats;
  onAgain: () => void;
  onHome: () => void;
  onSkins: () => void;
  onLeaderboard: () => void;
}

export function GameOverScreen({ stats, onAgain, onHome, onSkins, onLeaderboard }: GameOverScreenProps) {
  return (
    <motion.div className="coil-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.section
        className="coil-card coil-over"
        initial={{ y: 28, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
      >
        {stats.isRecord && <p className="coil-record">New record</p>}
        <p className="coil-kicker">Current ended</p>
        <h2>Coil broken</h2>
        <p className="coil-empty">Your mass scattered across the ring. Drop back in and take it back.</p>
        <div className="coil-over-grid">
          <span>Score <b>{Math.floor(stats.score)}</b></span>
          <span>Length <b>{stats.length}</b></span>
          <span>Rank <b>#{stats.rank || '—'}</b></span>
          <span>Time <b>{Math.floor(stats.timeMs / 1000)}s</b></span>
          <span>Food <b>{stats.foodEaten}</b></span>
          <span>Cuts <b>{stats.kills}</b></span>
        </div>
        <p className="coil-over-best">Best mass {Math.floor(stats.bestScore)}</p>
        <div className="coil-over-actions">
          <button type="button" className="coil-cta" onClick={onAgain}>Play again</button>
          <button type="button" className="coil-ghost" onClick={onHome}>Home</button>
          <button type="button" className="coil-ghost" onClick={onSkins}>Skins</button>
          <button type="button" className="coil-ghost" onClick={onLeaderboard}>Leaderboard</button>
        </div>
      </motion.section>
    </motion.div>
  );
}
