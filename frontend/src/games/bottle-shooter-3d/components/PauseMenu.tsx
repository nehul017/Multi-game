'use client';

import { motion } from 'framer-motion';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onExit: () => void;
}

export function PauseMenu({ onResume, onRestart, onSettings, onExit }: PauseMenuProps) {
  return (
    <div className="bs-overlay">
      <motion.section
        className="bs-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="bs-kicker">Game Paused</p>
        <h2>Paused</h2>
        <div className="bs-menu-actions">
          <motion.button
            type="button"
            className="bs-cta"
            onClick={onResume}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Resume
          </motion.button>
          <button type="button" className="bs-ghost" onClick={onRestart}>
            Restart Level
          </button>
          <button type="button" className="bs-ghost" onClick={onSettings}>
            Settings
          </button>
          <button type="button" className="bs-ghost" onClick={onExit}>
            Exit to Menu
          </button>
        </div>
      </motion.section>
    </div>
  );
}
