'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BOTTLE_SHOOTER_BRAND } from '../brand';

interface StartScreenProps {
  highScore: number;
  starting: boolean;
  error: string | null;
  onPlay: () => void;
  onHowTo: () => void;
  onSettings: () => void;
}

export function StartScreen({ highScore, starting, error, onPlay, onHowTo, onSettings }: StartScreenProps) {
  return (
    <div className="bs-overlay bs-overlay-soft">
      <motion.section
        className="bs-menu"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/games" className="bs-back">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Games
        </Link>
        <p className="bs-kicker">{BOTTLE_SHOOTER_BRAND.category} · {BOTTLE_SHOOTER_BRAND.difficulty}</p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {BOTTLE_SHOOTER_BRAND.name}
        </motion.h1>
        <motion.p
          className="bs-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {BOTTLE_SHOOTER_BRAND.tagline}
        </motion.p>
        {highScore > 0 && <p className="bs-best">Personal Best · {highScore.toLocaleString('en-US')}</p>}
        {error && (
          <p className="bs-error" role="alert">
            {error}
          </p>
        )}
        <div className="bs-menu-actions">
          <motion.button
            type="button"
            className="bs-cta bs-cta-play"
            onClick={onPlay}
            disabled={starting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {starting ? 'Loading…' : 'Play'}
          </motion.button>
          <button type="button" className="bs-ghost" onClick={onHowTo}>
            How to Play
          </button>
          <button type="button" className="bs-ghost" onClick={onSettings}>
            Settings
          </button>
        </div>
      </motion.section>
    </div>
  );
}
