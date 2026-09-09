'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface ResultOverlayProps {
  score: number;
  roomsSolved: number;
  roomCount: number;
  highScore: number;
  isNewHigh: boolean;
  onPlayAgain: () => void;
  saving?: boolean;
  saveError?: string | null;
  coins?: number;
  xp?: number;
}

export function ResultOverlay({
  score,
  roomsSolved,
  roomCount,
  highScore,
  isNewHigh,
  onPlayAgain,
  saving,
  saveError,
  coins,
  xp,
}: ResultOverlayProps) {
  const router = useRouter();
  const cleared = roomsSolved >= roomCount;

  return (
    <div className="pw-overlay pw-overlay-over" role="dialog" aria-labelledby="pw-over-title" aria-modal="true">
      <motion.section
        className="pw-dialog"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
      >
        {isNewHigh && <p className="pw-record">New best</p>}
        <h2 id="pw-over-title">{cleared ? 'Atlas complete' : 'Run finished'}</h2>
        <div className="pw-over-grid">
          <span>
            Score <b>{score.toLocaleString('en-US')}</b>
          </span>
          <span>
            Rooms <b>{roomsSolved}/{roomCount}</b>
          </span>
          <span>
            Best <b>{highScore.toLocaleString('en-US')}</b>
          </span>
          {coins != null && (
            <span>
              Coins <b>+{coins}</b>
            </span>
          )}
          {xp != null && (
            <span>
              XP <b>+{xp}</b>
            </span>
          )}
        </div>
        {saving && <p className="pw-copy">Saving result…</p>}
        {saveError && (
          <p className="pw-copy" role="alert">
            {saveError}
          </p>
        )}
        <div className="pw-dialog-actions">
          <Button size="lg" onClick={onPlayAgain} className="w-full">
            Play again
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => router.push('/games')}>
            Back to Games
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
