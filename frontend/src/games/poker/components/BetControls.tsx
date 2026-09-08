'use client';

interface BetControlsProps {
  value: number;
  min: number;
  max: number;
  pot: number;
  onChange: (value: number) => void;
}

const PRESETS = [
  { label: '1/2 POT', factor: 0.5 },
  { label: '2/3 POT', factor: 2 / 3 },
  { label: '3/4 POT', factor: 0.75 },
  { label: 'POT', factor: 1 },
  { label: '2× POT', factor: 2 },
];

export function BetControls({ value, min, max, pot, onChange }: BetControlsProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)));

  return (
    <div className="pk-bet-controls">
      <div className="pk-bet-stepper">
        <button type="button" onClick={() => onChange(clamp(value - min))}>-</button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(clamp(Number(event.target.value) || min))}
        />
        <button type="button" onClick={() => onChange(clamp(value + min))}>+</button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={Math.min(max, Math.max(min, value))}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="pk-bet-presets">
        {PRESETS.map((preset) => (
          <button key={preset.label} type="button" onClick={() => onChange(clamp(pot * preset.factor))}>
            {preset.label}
          </button>
        ))}
        <button type="button" onClick={() => onChange(max)}>
          ALL-IN
        </button>
      </div>
    </div>
  );
}
