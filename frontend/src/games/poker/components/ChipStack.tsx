'use client';

import { PokerChip } from './PokerChip';

const DENOMS = [500, 100, 25, 5, 1];

function breakAmount(amount: number): Array<{ value: number; count: number }> {
  let left = Math.max(0, Math.round(amount));
  return DENOMS.map((value) => {
    const count = Math.min(8, Math.floor(left / value));
    left -= count * value;
    return { value, count };
  }).filter((stack) => stack.count > 0);
}

export function ChipStack({ amount, label }: { amount: number; label?: string }) {
  if (amount <= 0) return null;
  const stacks = breakAmount(amount);

  return (
    <div className="pk-chip-stack" title={label ? `${label} · ${amount}` : String(amount)}>
      <div className="pk-chip-piles">
        {stacks.map((stack) => (
          <span key={stack.value} className="pk-chip-pile">
            {Array.from({ length: stack.count }).map((_, index) => (
              <span key={index} className="pk-chip-layer" style={{ bottom: `${index * 4}px` }}>
                <PokerChip amount={amount} face={stack.value} compact />
              </span>
            ))}
          </span>
        ))}
      </div>
      <span className="pk-chip-stack-label">
        {label ? `${label} · ${amount}` : amount}
      </span>
    </div>
  );
}
