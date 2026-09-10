'use client';

import { motion, type MotionValue, useTransform } from 'framer-motion';

const PARTICLES = [
  { top: '8%', left: '11%', size: 2, delay: '0s', duration: '7.4s', glow: false },
  { top: '16%', left: '72%', size: 3, delay: '1.1s', duration: '8.2s', glow: true },
  { top: '24%', left: '28%', size: 2, delay: '2.4s', duration: '6.6s', glow: false },
  { top: '33%', left: '86%', size: 2, delay: '0.6s', duration: '7.8s', glow: false },
  { top: '41%', left: '6%', size: 3, delay: '3.2s', duration: '8.8s', glow: true },
  { top: '48%', left: '54%', size: 2, delay: '1.8s', duration: '6.9s', glow: false },
  { top: '57%', left: '78%', size: 4, delay: '2.8s', duration: '9.1s', glow: true },
  { top: '64%', left: '18%', size: 2, delay: '0.4s', duration: '7.1s', glow: false },
  { top: '71%', left: '42%', size: 3, delay: '3.8s', duration: '8.4s', glow: false },
  { top: '78%', left: '91%', size: 2, delay: '1.4s', duration: '6.4s', glow: false },
  { top: '12%', left: '48%', size: 2, delay: '4.2s', duration: '7.6s', glow: false },
  { top: '86%', left: '32%', size: 3, delay: '2.1s', duration: '8.6s', glow: true },
  { top: '38%', left: '38%', size: 2, delay: '5s', duration: '6.8s', glow: false },
  { top: '52%', left: '64%', size: 2, delay: '0.9s', duration: '7.9s', glow: false },
  { top: '21%', left: '92%', size: 3, delay: '3.5s', duration: '8s', glow: false },
  { top: '69%', left: '58%', size: 2, delay: '4.6s', duration: '7.3s', glow: true },
];

interface ParticleBackgroundProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  parallax: boolean;
}

export function ParticleBackground({ x, y, parallax }: ParticleBackgroundProps) {
  const shiftX = useTransform(x, [-1, 1], [5, -5]);
  const shiftY = useTransform(y, [-1, 1], [4, -4]);

  return (
    <motion.div
      className="home-atmosphere-layer home-atmosphere-near"
      style={parallax ? { x: shiftX, y: shiftY } : undefined}
    >
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className={particle.glow ? 'home-spark home-spark-glow' : 'home-spark'}
          style={{
            top: particle.top,
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </motion.div>
  );
}
