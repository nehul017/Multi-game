'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface JigsawResultProps {
  title: string;
  score: number;
  highScore: number;
  isNewHigh: boolean;
  placed: number;
  total: number;
  elapsedMs: number;
  difficulty: string;
  onPlayAgain: () => void;
  onGallery: () => void;
  saving?: boolean;
  saveError?: string | null;
  coins?: number;
  xp?: number;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function JigsawResult({
  title,
  score,
  highScore,
  isNewHigh,
  placed,
  total,
  elapsedMs,
  difficulty,
  onPlayAgain,
  onGallery,
  saving,
  saveError,
  coins,
  xp,
}: JigsawResultProps) {
  const router = useRouter();

  return (
    <div className="jw-overlay" role="dialog" aria-labelledby="jw-over-title" aria-modal="true">
      <motion.section
        className="jw-dialog"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
      >
        {isNewHigh && <p className="jw-record">New best</p>}
        <p className="jw-kicker">Puzzle complete</p>
        <h2 id="jw-over-title">{title}</h2>
        <div className="jw-over-grid">
          <span>
            Score <b>{score.toLocaleString('en-US')}</b>
          </span>
          <span>
            Time <b>{formatTime(elapsedMs)}</b>
          </span>
          <span>
            Pieces <b>
              {placed}/{total}
            </b>
          </span>
          <span>
            {difficulty} <b>{highScore.toLocaleString('en-US')} best</b>
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
        {saving && <p className="jw-copy">Saving result…</p>}
        {saveError && (
          <p className="jw-copy" role="alert">
            {saveError}
          </p>
        )}
        <div className="jw-dialog-actions">
          <Button size="lg" onClick={onPlayAgain} className="w-full">
            Play again
          </Button>
          <Button size="lg" variant="secondary" className="w-full" onClick={onGallery}>
            More puzzles
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => router.push('/games')}>
            Back to Games
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
