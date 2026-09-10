'use client';

import { motion } from 'framer-motion';

interface LoadingScreenProps {
  progress: number;
  message?: string;
}

export function LoadingScreen({ progress, message = 'LOADING RANGE...' }: LoadingScreenProps) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div className="bs-overlay bs-load" role="status" aria-live="polite">
      <motion.section
        className="bs-load-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="bs-kicker">Shooting Range</p>
        <h2>Bottle Shooter 3D</h2>
        <p className="bs-load-sub">LOADING RANGE...</p>
        <p className="bs-copy">{message}</p>
        <div className="bs-load-bar" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="bs-load-pct">{pct}%</p>
      </motion.section>
    </div>
  );
}
