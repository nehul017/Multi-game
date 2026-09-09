'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface GameOverOverlayProps {
  score: number;
  level: number;
  lines: number;
  highScore: number;
  isNewHigh: boolean;
  onPlayAgain: () => void;
  saving?: boolean;
  saveError?: string | null;
  coins?: number;
  xp?: number;
}

export function GameOverOverlay({
  score,
  level,
  lines,
  highScore,
  isNewHigh,
  onPlayAgain,
  saving,
  saveError,
  coins,
  xp,
}: GameOverOverlayProps) {
  const router = useRouter();

  return (
    <div className="bm-overlay bm-overlay-over" role="dialog" aria-labelledby="bm-over-title" aria-modal="true">
      <motion.section
        className="bm-dialog"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
      >
        {isNewHigh && <p className="bm-record">New best</p>}
        <h2 id="bm-over-title">Game Over</h2>
        <div className="bm-over-grid">
          <span>
            Final score <b>{score.toLocaleString('en-US')}</b>
          </span>
          <span>
            Level <b>{level}</b>
          </span>
          <span>
            Lines cleared <b>{lines}</b>
          </span>
          <span>
            Best score <b>{highScore.toLocaleString('en-US')}</b>
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
        {saving && <p className="bm-copy">Saving result…</p>}
        {saveError && <p className="bm-copy" role="alert">{saveError}</p>}
        <div className="bm-dialog-actions">
          <Button size="lg" onClick={onPlayAgain} className="w-full">
            Play Again
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => router.push('/games')}>
            Back to Games
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
