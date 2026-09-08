'use client';

import type { PublicPayline, WinningLine } from '../types';

interface PaylineIndicatorProps {
  side: 'left' | 'right';
  paylines: readonly PublicPayline[];
  winningLines: WinningLine[];
}

export function PaylineIndicator({ side, paylines, winningLines }: PaylineIndicatorProps) {
  const lamps = paylines.slice(0, 5);
  const lit = new Set(winningLines.map((line) => line.paylineId));

  return (
    <ol className={`cfs-lamps cfs-lamps-${side}`} aria-label={`${side} payline lamps`}>
      {lamps.map((line, index) => (
        <li key={line.id}>
          <span className={`cfs-lamp${lit.has(line.id) ? ' is-lit' : ''}`} title={line.name}>
            {index + 1}
          </span>
        </li>
      ))}
    </ol>
  );
}
