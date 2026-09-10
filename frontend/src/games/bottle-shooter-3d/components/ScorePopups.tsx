'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ScorePopup } from '../types';

interface ScorePopupsProps {
  items: ScorePopup[];
}

export function ScorePopups({ items }: ScorePopupsProps) {
  return (
    <div className="bs-popups" aria-hidden="true">
      <AnimatePresence>
        {items.slice(-5).map((item) => (
          <motion.span
            key={item.id}
            className={`bs-popup is-${item.kind}`}
            initial={{ opacity: 0, y: 14, scale: 0.8 }}
            animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0, y: -52, scale: 0.9 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            {item.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
