'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
}

export function PauseOverlay({ onResume, onRestart }: PauseOverlayProps) {
  return (
    <div className="bm-overlay" role="dialog" aria-labelledby="bm-pause-title" aria-modal="true">
      <motion.section
        className="bm-dialog"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        <h2 id="bm-pause-title">Game Paused</h2>
        <p className="bm-copy">The stack is waiting. Resume when you are ready.</p>
        <div className="bm-dialog-actions">
          <Button size="lg" onClick={onResume} className="w-full">
            Resume
          </Button>
          <Button size="lg" variant="secondary" onClick={onRestart} className="w-full">
            Restart
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
