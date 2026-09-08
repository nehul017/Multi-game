'use client';

const CHIP_COLORS = [
  { min: 500, className: 'is-black', label: '500' },
  { min: 100, className: 'is-purple', label: '100' },
  { min: 25, className: 'is-green', label: '25' },
  { min: 5, className: 'is-red', label: '5' },
  { min: 0, className: 'is-white', label: '1' },
];

export function chipClass(amount: number): string {
  return CHIP_COLORS.find((item) => amount >= item.min)?.className || 'is-white';
}

export function PokerChip({
  amount,
  compact,
  face,
}: {
  amount: number;
  compact?: boolean;
  face?: number;
}) {
  const shown = face ?? amount;
  return (
    <span className={`pk-chip ${chipClass(shown)} ${compact ? 'is-compact' : ''}`}>
      <span className="pk-chip-spots" aria-hidden />
      <span className="pk-chip-rim" />
      <span className="pk-chip-value">{shown >= 1000 ? `${Math.round(shown / 100) / 10}k` : shown}</span>
    </span>
  );
}
