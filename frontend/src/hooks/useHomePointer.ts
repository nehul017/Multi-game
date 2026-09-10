'use client';

import { useEffect } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useFinePointer } from '@/hooks/useFinePointer';

const SPRING = { stiffness: 48, damping: 24, mass: 0.85 };
const GLOW_SPRING = { stiffness: 70, damping: 28, mass: 0.7 };

export function useHomePointer() {
  const finePointer = useFinePointer();
  const reduceMotion = useReducedMotion();
  const enabled = Boolean(finePointer && !reduceMotion);

  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const rawX = useMotionValue(-240);
  const rawY = useMotionValue(-240);

  const px = useSpring(nx, SPRING);
  const py = useSpring(ny, SPRING);
  const glowX = useSpring(rawX, GLOW_SPRING);
  const glowY = useSpring(rawY, GLOW_SPRING);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      nx.set((event.clientX / width) * 2 - 1);
      ny.set((event.clientY / height) * 2 - 1);
      rawX.set(event.clientX);
      rawY.set(event.clientY);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled, nx, ny, rawX, rawY]);

  return { enabled, px, py, glowX, glowY };
}
