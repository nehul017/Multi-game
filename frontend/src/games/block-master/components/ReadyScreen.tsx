'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface ReadyScreenProps {
  highScore: number;
  onStart: () => void;
}

export function ReadyScreen({ highScore, onStart }: ReadyScreenProps) {
  const router = useRouter();

  return (
    <div className="bm-overlay" role="dialog" aria-labelledby="bm-ready-title" aria-modal="true">
      <motion.section
        className="bm-dialog"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        <p className="bm-kicker">Puzzle</p>
        <h2 id="bm-ready-title">Block Master</h2>
        <p className="bm-copy">Stack, rotate, and clear under rising pressure.</p>
        <p className="bm-best">Best: {highScore.toLocaleString('en-US')}</p>
        <ul className="bm-keys" aria-label="Keyboard controls">
          <li>← → move</li>
          <li>↑ rotate</li>
          <li>↓ soft drop</li>
          <li>Space hard drop</li>
          <li>C hold · P pause</li>
        </ul>
        <div className="bm-dialog-actions">
          <Button size="lg" onClick={onStart} className="w-full">
            Start Game
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => router.push('/games')}>
            Back to Games
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
