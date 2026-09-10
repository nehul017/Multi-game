'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  format = (next) => next.toLocaleString(),
  duration = 1100,
  className,
}: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const startedRef = useRef(false);
  const frameRef = useRef(0);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    if (startedRef.current) {
      setDisplay(value);
      return;
    }

    const node = nodeRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || startedRef.current) return;
        startedRef.current = true;

        const origin = performance.now();
        const from = 0;
        const tick = (now: number) => {
          const progress = Math.min(1, (now - origin) / duration);
          const eased = 1 - (1 - progress) ** 3;
          setDisplay(Math.round(from + (value - from) * eased));
          if (progress < 1) {
            frameRef.current = requestAnimationFrame(tick);
          }
        };
        frameRef.current = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, reduceMotion]);

  return (
    <span ref={nodeRef} className={className}>
      {format(display)}
    </span>
  );
}
