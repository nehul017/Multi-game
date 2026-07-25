'use client';

import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const PARTICLES = [
  { top: '10%', left: '15%', size: 4, delay: 0 },
  { top: '25%', left: '80%', size: 3, delay: 1 },
  { top: '45%', left: '60%', size: 5, delay: 2 },
  { top: '70%', left: '25%', size: 3, delay: 0.5 },
  { top: '85%', left: '70%', size: 4, delay: 1.5 },
  { top: '55%', left: '90%', size: 2, delay: 3 },
];

const LIGHT_ORBS = [
  { top: '15%', left: '70%', size: 120, delay: 0 },
  { top: '60%', left: '10%', size: 80, delay: 2 },
  { top: '80%', left: '50%', size: 100, delay: 4 },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell-bg" aria-hidden="true">
        <div className="app-shell-glow-tr" />
        <div className="app-shell-glow-bl" />
        <div className="app-shell-grid" />
        <div className="app-shell-noise" />
        <div className="app-shell-particles">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="app-shell-particle"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
        <div className="app-shell-streak" style={{ top: '30%', animationDelay: '0s' }} />
        <div className="app-shell-streak" style={{ top: '65%', animationDelay: '6s' }} />
        {LIGHT_ORBS.map((orb, i) => (
          <div
            key={`orb-${i}`}
            className="app-shell-float-orb"
            style={{
              top: orb.top,
              left: orb.left,
              width: orb.size,
              height: orb.size,
              animationDelay: `${orb.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="app-shell-content">{children}</div>
    </div>
  );
}
