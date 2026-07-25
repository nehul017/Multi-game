'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChessArenaProps {
  children: React.ReactNode;
  className?: string;
}

export function ChessArena({ children, className }: ChessArenaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('chess-arena relative overflow-hidden rounded-2xl sm:rounded-3xl', className)}
    >
      {/* Studio wash — matches the charcoal product-shot backdrop */}
      <div className="chess-arena-glow pointer-events-none absolute inset-0" />
      <div className="chess-arena-vignette pointer-events-none absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-[22%] rounded-[50%] blur-3xl opacity-70"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 70%)',
        }}
      />
      <div className="relative z-[1] flex items-center justify-center p-4 sm:p-8 md:p-12 min-h-[320px] sm:min-h-[400px] lg:min-h-[480px]">
        {children}
      </div>
    </motion.div>
  );
}
