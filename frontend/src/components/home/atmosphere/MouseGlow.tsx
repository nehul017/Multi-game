'use client';

import { motion, type MotionValue } from 'framer-motion';

interface MouseGlowProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

export function MouseGlow({ x, y }: MouseGlowProps) {
  return (
    <motion.div className="home-mouse-glow" style={{ x, y }} />
  );
}
