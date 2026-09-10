'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AnimatedBackground } from '@/components/home/atmosphere/AnimatedBackground';
import { FloatingGamingElements } from '@/components/home/atmosphere/FloatingGamingElements';
import { MouseGlow } from '@/components/home/atmosphere/MouseGlow';
import { ParticleBackground } from '@/components/home/atmosphere/ParticleBackground';
import { useHomePointer } from '@/hooks/useHomePointer';

export function HomeAtmosphere() {
  const reduceMotion = useReducedMotion();
  const { enabled, px, py, glowX, glowY } = useHomePointer();

  if (reduceMotion) {
    return (
      <div className="home-atmosphere" aria-hidden="true">
        <div className="home-atmosphere-mesh home-atmosphere-mesh-static" />
      </div>
    );
  }

  return (
    <motion.div
      className="home-atmosphere"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <AnimatedBackground x={px} y={py} parallax={enabled} />
      <FloatingGamingElements x={px} y={py} parallax={enabled} />
      <ParticleBackground x={px} y={py} parallax={enabled} />
      {enabled && <MouseGlow x={glowX} y={glowY} />}
    </motion.div>
  );
}
