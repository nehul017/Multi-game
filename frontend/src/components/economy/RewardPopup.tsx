'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Sparkles, X } from 'lucide-react';

interface RewardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title?: string;
  description?: string;
  autoCloseMs?: number;
}

const SPARKLE_COUNT = 10;

export function RewardPopup({
  isOpen,
  onClose,
  amount,
  title = 'Reward Claimed!',
  description,
  autoCloseMs = 3200,
}: RewardPopupProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isOpen, autoCloseMs, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--overlay)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative surface-card px-8 py-8 rounded-card text-center max-w-xs shadow-glow-purple overflow-hidden"
          >
            {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-amber-400"
                style={{ left: `${8 + i * 9}%`, top: '52%' }}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -80 - (i % 3) * 20,
                  x: (i % 2 === 0 ? 1 : -1) * (16 + i * 4),
                  scale: [0.5, 1, 0.5],
                  rotate: 360,
                }}
                transition={{ duration: 1.6, delay: i * 0.05, ease: 'easeOut' }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.span>
            ))}

            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-primary-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, -8, 8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-glow-purple mb-4"
            >
              <Coins className="w-8 h-8 text-theme-primary" />
            </motion.div>

            <h3 className="text-lg font-display font-bold text-theme-primary mb-1">{title}</h3>
            <p className="text-2xl font-display font-bold gradient-text mb-1">
              +{amount.toLocaleString()} coins
            </p>
            {description && <p className="text-sm text-theme-muted">{description}</p>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
