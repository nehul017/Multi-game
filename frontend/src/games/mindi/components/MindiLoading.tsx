'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

const LINES: Record<string, string> = {
  connecting: 'Preparing table…',
  matchmaking: 'Finding a Mindi table…',
  waiting: 'Waiting for players…',
  shuffling: 'Shuffling cards…',
  dealing: 'Dealing cards…',
  filling: 'Seating the table…',
};

interface MindiLoadingProps {
  phase?: keyof typeof LINES;
  detail?: string;
  action?: ReactNode;
}

export function MindiLoading({ phase = 'connecting', detail, action }: MindiLoadingProps) {
  return (
    <div className="mindi-loading" role="status" aria-live="polite">
      <div className="mindi-loading-deck" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <motion.span
            key={index}
            className="mindi-loading-card"
            animate={{ y: [0, -8, 0], rotate: [-4 + index * 4, 2, -4 + index * 4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="mindi-loading-title">{LINES[phase]}</p>
      {detail && <p className="mindi-loading-detail">{detail}</p>}
      {action}
    </div>
  );
}
