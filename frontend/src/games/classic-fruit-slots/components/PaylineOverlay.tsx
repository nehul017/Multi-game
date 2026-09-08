'use client';

import type { PublicPayline, WinningLine } from '../types';

interface PaylineOverlayProps {
  paylines: readonly PublicPayline[];
  winningLines: WinningLine[];
  reelCount: number;
  rowCount: number;
}

const COLORS = ['#fbbf24', '#fb7185', '#38bdf8', '#c084fc', '#4ade80', '#fb923c', '#f472b6', '#22d3ee', '#facc15'];

export function PaylineOverlay({ paylines, winningLines, reelCount, rowCount }: PaylineOverlayProps) {
  if (winningLines.length === 0) return null;
  const winners = new Set(winningLines.map((line) => line.paylineId));

  return (
    <svg className="cfs-paylines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {paylines.map((line, index) => {
        if (!winners.has(line.id)) return null;
        const points = line.pattern
          .map((row, reel) => `${((reel + 0.5) / reelCount) * 100},${((row + 0.5) / rowCount) * 100}`)
          .join(' ');
        return (
          <polyline
            key={line.id}
            points={points}
            fill="none"
            stroke={COLORS[index % COLORS.length]}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cfs-payline-path"
          />
        );
      })}
    </svg>
  );
}
