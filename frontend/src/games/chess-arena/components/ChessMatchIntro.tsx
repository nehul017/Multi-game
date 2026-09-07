'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';

interface ChessMatchIntroProps {
  phase: 'vs' | 'count' | null;
  count: number | string | null;
  playerName: string;
  opponentName: string;
  playerAvatar?: string;
  opponentAvatar?: string;
}

export function ChessMatchIntro({
  phase,
  count,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
}: ChessMatchIntroProps) {
  if (!phase) return null;

  return (
    <motion.div
      className="cx-intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {phase === 'vs' && (
        <div className="cx-intro-card">
          <p className="text-[11px] uppercase tracking-[0.2em] text-theme-muted font-semibold">Match found</p>
          <div className="flex items-center justify-center gap-6 mt-5">
            <div className="text-center">
              <Avatar src={opponentAvatar} name={opponentName} size="lg" />
              <p className="mt-2 text-sm font-semibold text-theme-primary">{opponentName}</p>
            </div>
            <span className="font-display text-xl font-bold gradient-text">VS</span>
            <div className="text-center">
              <Avatar src={playerAvatar} name={playerName} size="lg" />
              <p className="mt-2 text-sm font-semibold text-theme-primary">{playerName}</p>
            </div>
          </div>
        </div>
      )}
      {phase === 'count' && (
        <AnimatePresence mode="wait">
          <motion.span
            key={String(count)}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            className="font-display text-7xl sm:text-8xl font-bold gradient-text"
          >
            {count}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
