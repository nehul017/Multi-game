'use client';

import { SlotSymbol } from './SlotSymbol';

function Crown() {
  return (
    <svg className="cfs-crown" viewBox="0 0 80 36" aria-hidden>
      <path
        d="M8 30 16 10l12 12 12-18 12 18 12-12 8 20H8z"
        fill="url(#cfs-crown-fill)"
        stroke="#7a5310"
        strokeWidth="1.4"
      />
      <circle cx="16" cy="10" r="3.2" fill="#fff4b8" />
      <circle cx="40" cy="6" r="3.6" fill="#fff4b8" />
      <circle cx="64" cy="10" r="3.2" fill="#fff4b8" />
      <defs>
        <linearGradient id="cfs-crown-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4b8" />
          <stop offset="50%" stopColor="#e4c15a" />
          <stop offset="100%" stopColor="#7a5310" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MachineMarquee() {
  return (
    <header className="cfs-marquee">
      <div className="cfs-marquee-gems" aria-hidden>
        {Array.from({ length: 13 }, (_, index) => (
          <span key={index} className="cfs-gem" style={{ animationDelay: `${index * 0.14}s` }} />
        ))}
      </div>
      <div className="cfs-marquee-plate">
        <div className="cfs-marquee-fruits" aria-hidden>
          <SlotSymbol type="cherry" compact />
          <SlotSymbol type="lemon" compact />
        </div>
        <div className="cfs-marquee-copy">
          <Crown />
          <p className="cfs-title-classic">CLASSIC</p>
          <h1 className="cfs-title-fruit">FRUIT SLOTS</h1>
        </div>
        <div className="cfs-marquee-fruits" aria-hidden>
          <SlotSymbol type="orange" compact />
          <SlotSymbol type="grapes" compact />
        </div>
      </div>
    </header>
  );
}
