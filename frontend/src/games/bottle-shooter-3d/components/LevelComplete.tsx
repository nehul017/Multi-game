'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { LevelStats } from '../types';

interface LevelCompleteProps {
  level: number;
  lastLevel: boolean;
  stats: LevelStats;
  onNext: () => void;
  onReplay: () => void;
}

const statVariant = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function LevelComplete({ level, lastLevel, stats, onNext, onReplay }: LevelCompleteProps) {
  const items = [
    { label: 'Score', value: stats.score.toLocaleString('en-US') },
    { label: 'Accuracy', value: `${stats.accuracy}%` },
    { label: 'Shots Fired', value: String(stats.shots) },
    { label: 'Bottles Broken', value: String(stats.bottlesBroken) },
    { label: 'Best Combo', value: `×${Math.max(1, stats.bestCombo)}` },
  ];

  return (
    <div className="bs-overlay">
      <motion.section
        className="bs-card bs-card-wide"
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="bs-kicker">{lastLevel ? 'Range Mastered' : 'Range Cleared'}</p>
        <h2>{lastLevel ? 'All Levels Complete!' : 'Level Complete'}</h2>
        <p className="bs-copy">
          {lastLevel
            ? 'Every shelf is empty. You own the range.'
            : `Level ${level} cleared. Ready for the next challenge?`}
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
          {!lastLevel && (
            <motion.button
              type="button"
              className="bs-cta"
              onClick={onNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Next Level →
            </motion.button>
          )}
          <button type="button" className={lastLevel ? 'bs-cta' : 'bs-ghost'} onClick={onReplay}>
            Replay
          </button>
          <Link href="/games" className="bs-ghost">
            Back to Games
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
