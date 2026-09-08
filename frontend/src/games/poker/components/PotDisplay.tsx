'use client';

import type { PotState } from '../types';
import { ChipStack } from './ChipStack';

export function SidePotDisplay({ pots }: { pots: PotState[] }) {
  if (pots.length <= 1) return null;
  return (
    <div className="pk-side-pots">
      {pots.map((pot) => (
        <div key={pot.id} className="pk-side-pot">
          <span>{pot.label}</span>
          <strong>{pot.amount}</strong>
        </div>
      ))}
    </div>
  );
}

export function PotDisplay({ pot, pots }: { pot: number; pots: PotState[] }) {
  return (
    <div className="pk-pot">
      <ChipStack amount={Math.max(pot, 0)} />
      <p className="pk-pot-label">Main pot</p>
      <p className="pk-pot-value">{pot.toLocaleString()}</p>
      <SidePotDisplay pots={pots} />
    </div>
  );
}
