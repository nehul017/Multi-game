'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface CountdownOverlayProps {
  value: number | 'GO';
}

export function CountdownOverlay({ value }: CountdownOverlayProps) {
  return (
    <div className="bs-count-wrap" aria-live="assertive">
      <AnimatePresence mode="wait">
        <motion.span
          key={String(value)}
          className="bs-count"
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
