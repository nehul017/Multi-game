'use client';

import type { ShowdownResult } from '../types';

export function WinnerDisplay({ showdown }: { showdown: ShowdownResult }) {
  const names = Array.from(
    new Set(showdown.pots.flatMap((pot) => pot.winners.map((winner) => winner.username)))
  );
  return (
    <div className="pk-winner">
      <p>WINNER</p>
      <h2>{names.join(' & ') || 'Pot awarded'}</h2>
      <ul>
        {showdown.pots.map((pot) => (
          <li key={pot.potId}>
            {pot.label}: {pot.winners.map((winner) => `${winner.username} +${winner.share}`).join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HandStrength({ label }: { label?: string }) {
  if (!label) return null;
  return <p className="pk-hand-strength">{label}</p>;
}
