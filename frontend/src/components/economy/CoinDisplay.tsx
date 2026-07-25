'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  sm: { pill: 'px-2.5 py-1 text-xs gap-1.5', icon: 'w-3.5 h-3.5' },
  md: { pill: 'px-3.5 py-1.5 text-sm gap-2', icon: 'w-4 h-4' },
  lg: { pill: 'px-5 py-2.5 text-lg gap-2.5', icon: 'w-5 h-5' },
};

export function CoinDisplay({ value, size = 'md', className, onClick }: CoinDisplayProps) {
  const [display, setDisplay] = useState(value);
  const [bump, setBump] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) return;

    if (end > start) {
      setBump(true);
      setTimeout(() => setBump(false), 500);
    }

    const duration = 700;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevValue.current = end;
    };

    requestAnimationFrame(tick);
  }, [value]);

  const Wrapper = onClick ? motion.button : motion.div;

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.96 } : undefined}
      className={cn(
        'inline-flex items-center rounded-full font-semibold border transition-colors',
        'bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-amber-500/30 text-amber-500',
        onClick ? 'cursor-pointer hover:border-amber-500/50' : 'cursor-default',
        sizeConfig[size].pill,
        className
      )}
    >
      <motion.span
        animate={bump ? { rotate: [0, -18, 18, 0], scale: [1, 1.3, 1] } : undefined}
        transition={{ duration: 0.5 }}
        className="inline-flex"
      >
        <Coins className={sizeConfig[size].icon} />
      </motion.span>
      <span className="font-display tabular-nums">{display.toLocaleString()}</span>
    </Wrapper>
  );
}
