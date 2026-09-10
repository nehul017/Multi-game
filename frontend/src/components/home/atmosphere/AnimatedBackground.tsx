'use client';

import { motion, type MotionValue, useTransform } from 'framer-motion';

interface AnimatedBackgroundProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  parallax: boolean;
}

export function AnimatedBackground({ x, y, parallax }: AnimatedBackgroundProps) {
  const shiftX = useTransform(x, [-1, 1], [-10, 10]);
  const shiftY = useTransform(y, [-1, 1], [-7, 7]);

  return (
    <motion.div
      className="home-atmosphere-layer home-atmosphere-far"
      style={parallax ? { x: shiftX, y: shiftY } : undefined}
    >
      <div className="home-atmosphere-mesh" />
      <div className="home-orb home-orb-purple" />
      <div className="home-orb home-orb-blue" />
      <div className="home-orb home-orb-pink" />
      <div className="home-orb home-orb-cyan" />
      <div className="home-orb home-orb-ember" />
    </motion.div>
  );
}
