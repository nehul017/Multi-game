'use client';

import { useReducedMotion } from 'framer-motion';
import { FloatGlyph } from '@/components/home/atmosphere/FloatingGamingElements';

const HERO_FLOATS = [
  { kind: 'ace-spade' as const, top: '18%', left: '6%', size: 38, duration: '8.6s', delay: '0.4s', rotate: -10 },
  { kind: 'seven' as const, top: '22%', left: '90%', size: 32, duration: '7.8s', delay: '0.55s', rotate: 8 },
  { kind: 'chip-gold' as const, top: '68%', left: '8%', size: 28, duration: '9.2s', delay: '0.7s', rotate: 0 },
  { kind: 'star' as const, top: '74%', left: '86%', size: 20, duration: '7.4s', delay: '0.85s', rotate: 0 },
];

const PARTICLES = [
  { top: '14%', left: '8%', size: 3, delay: '0s', duration: '6.4s' },
  { top: '22%', left: '78%', size: 2, delay: '1.2s', duration: '7.1s' },
  { top: '38%', left: '18%', size: 4, delay: '2.1s', duration: '5.8s' },
  { top: '48%', left: '88%', size: 2, delay: '0.6s', duration: '6.8s' },
  { top: '62%', left: '12%', size: 3, delay: '3.4s', duration: '7.4s' },
  { top: '70%', left: '64%', size: 2, delay: '1.8s', duration: '5.6s' },
  { top: '28%', left: '42%', size: 2, delay: '4s', duration: '6.2s' },
  { top: '80%', left: '36%', size: 3, delay: '2.6s', duration: '7.6s' },
  { top: '16%', left: '58%', size: 2, delay: '0.4s', duration: '5.4s' },
  { top: '54%', left: '48%', size: 3, delay: '3s', duration: '6.9s' },
];

export function HeroAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="hero-atmosphere" aria-hidden="true">
      <div className="hero-atmosphere-gradient" />
      <div className="hero-atmosphere-glow hero-atmosphere-glow-a" />
      <div className="hero-atmosphere-glow hero-atmosphere-glow-b" />
      <div className="hero-atmosphere-glow hero-atmosphere-glow-c" />
      <div className="hero-atmosphere-glow hero-atmosphere-glow-d" />
      <div className="hero-atmosphere-shape hero-atmosphere-shape-a" />
      <div className="hero-atmosphere-shape hero-atmosphere-shape-b" />
      {!reduceMotion && (
        <>
          <div className="hero-atmosphere-particles">
            {PARTICLES.map((particle, index) => (
              <span
                key={index}
                className="hero-atmosphere-particle"
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
          </div>
          {HERO_FLOATS.map((item) => (
            <span
              key={item.kind}
              className={
                item.kind === 'ace-spade' || item.kind === 'star'
                  ? 'home-float-el home-float-hero'
                  : 'home-float-el home-float-hero home-float-desktop'
              }
              style={{
                top: item.top,
                left: item.left,
                width: item.size,
                height: item.size,
                animationDuration: item.duration,
                animationDelay: item.delay,
                ['--float-rotate' as string]: `${item.rotate}deg`,
              }}
            >
              <FloatGlyph kind={item.kind} />
            </span>
          ))}
        </>
      )}
    </div>
  );
}
