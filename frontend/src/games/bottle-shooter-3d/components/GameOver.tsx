'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { GameOverReason, RunStats } from '../types';

interface GameOverProps {
  reason: GameOverReason;
  stats: RunStats;
  onRetry: () => void;
}

const statVariant = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function GameOver({ reason, stats, onRetry }: GameOverProps) {
  const items = [
    { label: 'Final Score', value: stats.score.toLocaleString('en-US') },
    { label: 'Accuracy', value: `${stats.accuracy}%` },
    { label: 'Level Reached', value: String(stats.level) },
    { label: 'Targets Hit', value: String(stats.bottlesBroken) },
    { label: 'Best Combo', value: `×${Math.max(1, stats.bestCombo)}` },
  ];

  return (
    <div className="bs-overlay">
      <motion.section
        className="bs-card bs-card-wide"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="bs-kicker">Range Closed</p>
        <h2>{reason === 'ammo' ? 'Out of Ammo' : "Time's Up"}</h2>
        <p className="bs-copy">
          {reason === 'ammo'
            ? 'Your magazine is dry and reserves are empty.'
            : 'The clock has run out on this attempt.'}
        </p>
        <dl className="bs-stats">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              variants={statVariant}
              initial="hidden"
              animate="show"
              custom={i}
            >
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </motion.div>
          ))}
        </dl>
        <div className="bs-menu-actions">
          <motion.button
            type="button"
            className="bs-cta"
            onClick={onRetry}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Try Again
          </motion.button>
          <Link href="/games" className="bs-ghost">
            Back to Games
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
