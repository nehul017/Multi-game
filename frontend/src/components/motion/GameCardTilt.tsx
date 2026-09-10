'use client';

import { ReactNode, useCallback } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useFinePointer } from '@/hooks/useFinePointer';
import { cn } from '@/lib/utils';

interface GameCardTiltProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

const SPRING = { stiffness: 220, damping: 24, mass: 0.35 };

export function GameCardTilt({ children, className, disabled = false }: GameCardTiltProps) {
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const enabled = !disabled && !reduceMotion && finePointer;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), SPRING);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), SPRING);
  const glareX = useTransform(x, [-0.5, 0.5], [8, 92]);
  const glareY = useTransform(y, [-0.5, 0.5], [8, 92]);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.16), transparent 42%)`;

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      x.set((event.clientX - rect.left) / rect.width - 0.5);
      y.set((event.clientY - rect.top) / rect.height - 0.5);
    },
    [enabled, x, y]
  );

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <div className={cn('h-full [perspective:920px]', className)}>
      <motion.div
        className="relative h-full"
        style={
          enabled
            ? {
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
        whileHover={
          enabled
            ? { y: -6, scale: 1.02, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }
            : undefined
        }
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {children}
        {enabled && (
          <motion.div
            aria-hidden="true"
            className="home-card-glare"
            style={{ background: glare }}
          />
        )}
      </motion.div>
    </div>
  );
}
