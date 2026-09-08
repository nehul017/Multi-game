'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface WinOverlayProps {
  visible: boolean;
  amount: number;
  intense?: boolean;
}

export function WinOverlay({ visible, amount, intense = false }: WinOverlayProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible || amount <= 0) {
      setShown(0);
      return undefined;
    }
    const start = performance.now();
    const duration = intense ? 1100 : 700;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(amount * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [amount, intense, visible]);

  return (
    <AnimatePresence>
      {visible && amount > 0 && (
        <motion.div
          className={`cfs-win-banner${intense ? ' is-intense' : ''}`}
          initial={{ opacity: 0, scale: 0.82, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>WIN</span>
          <strong>+{shown.toLocaleString()} COINS</strong>
          <span className="cfs-win-sparks" aria-hidden>
            {Array.from({ length: intense ? 12 : 8 }, (_, index) => (
              <i key={index} style={{ animationDelay: `${index * 0.07}s` }} />
            ))}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
