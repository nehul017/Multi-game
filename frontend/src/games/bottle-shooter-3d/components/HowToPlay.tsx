'use client';

import { motion } from 'framer-motion';

interface HowToPlayProps {
  onBack: () => void;
}

export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="bs-overlay">
      <motion.section
        className="bs-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="bs-kicker">Training Manual</p>
        <h2>How to Play</h2>
        <ul className="bs-list">
          <li><strong>Aim</strong> — Move mouse or drag on touch screen to look around the range.</li>
          <li><strong>Shoot</strong> — Left click or tap the Fire button. Shots raycast from the crosshair center.</li>
          <li><strong>Reload</strong> — Press R or tap Reload when your magazine runs dry.</li>
          <li><strong>Objective</strong> — Clear every bottle before time or ammo runs out.</li>
          <li><strong>Scoring</strong> — Center hits, movers, spinners, and gold bottles award more points.</li>
          <li><strong>Combos</strong> — Chain hits rapidly to build combo multipliers (up to ×5).</li>
          <li><strong>Heavy bottles</strong> — Brown bottles take 2 clean hits to shatter.</li>
          <li><strong>Bonus & Gold</strong> — Purple bonus and gold bottles are rare, high-value targets.</li>
        </ul>
        <motion.button
          type="button"
          className="bs-cta"
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Got It
        </motion.button>
      </motion.section>
    </div>
  );
}
