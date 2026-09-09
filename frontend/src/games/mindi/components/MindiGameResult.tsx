'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MindiBoard, MindiTeam } from '../types';

interface MindiGameResultProps {
  board: MindiBoard;
  iWon: boolean;
  onPlayAgain?: () => void;
  onExit?: () => void;
}

function score(board: MindiBoard, team: MindiTeam) {
  return {
    tens: board.capturedTens?.[team] ?? 0,
    tricks: board.tricksWon?.[team] ?? 0,
  };
}

export function MindiGameResult({ board, iWon, onPlayAgain, onExit }: MindiGameResultProps) {
  const winnerTeam = board.winnerTeam;
  const reason = board.isMendikot
    ? 'Mendikot — all four 10s.'
    : board.isWhitewash
      ? 'Whitewash — all 13 tricks.'
      : board.winReason === 'tricks'
        ? 'Decided on tricks.'
        : 'Won on captured 10s.';

  return (
    <motion.div
      className="mindi-result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Game result"
    >
      <motion.div
        className="mindi-result-card"
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <p className="mindi-kicker">{iWon ? 'Table won' : 'Round complete'}</p>
        <h2>{winnerTeam ? `Team ${winnerTeam} wins` : 'Draw'}</h2>
        <p className="mindi-result-reason">{reason}</p>
        <div className="mindi-result-grid">
          {(['A', 'B'] as MindiTeam[]).map((team) => {
            const next = score(board, team);
            return (
              <div key={team} className={winnerTeam === team ? 'is-winner' : ''}>
                <strong>Team {team}</strong>
                <span>10s {next.tens}</span>
                <span>Tricks {next.tricks}</span>
              </div>
            );
          })}
        </div>
        <div className="mindi-result-actions">
          <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button variant="secondary" onClick={onExit}>
            Back to Lobby
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
