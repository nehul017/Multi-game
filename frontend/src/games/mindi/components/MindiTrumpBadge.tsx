'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SUIT_GLYPH, SUIT_LABEL, SUIT_PATH, isRedSuit, type MindiSuit } from '../types';

interface MindiTrumpBadgeProps {
  suit?: MindiSuit | null;
  revealed?: boolean;
}

export function MindiTrumpBadge({ suit, revealed }: MindiTrumpBadgeProps) {
  const reduce = useReducedMotion();
  const ready = Boolean(revealed && suit);

  return (
    <div className={`mindi-trump-badge ${ready ? 'is-live' : 'is-wait'}`} aria-label={ready && suit ? `Trump ${SUIT_LABEL[suit]}` : 'Trump waiting'}>
      <span className="mindi-kicker">Trump</span>
      <AnimatePresence mode="wait">
        {ready && suit ? (
          <motion.span
            key={suit}
            className={`mindi-trump-face ${isRedSuit(suit) ? 'is-red' : 'is-black'}`}
            initial={reduce ? false : { scale: 0.7, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={SUIT_PATH[suit]} />
            </svg>
            <b>{SUIT_GLYPH[suit]}</b>
            <em>{SUIT_LABEL[suit]}</em>
          </motion.span>
        ) : (
          <motion.span key="wait" className="mindi-trump-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Waiting…
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
