'use client';

import { Minus, Plus } from 'lucide-react';
import { fruitSlotsAudio } from '../audio';

interface BetControlsProps {
  bet: number;
  minBet: number;
  maxBet: number;
  step: number;
  presets: readonly number[];
  disabled: boolean;
  onChange: (next: number) => void;
}

export function BetControls({ bet, minBet, maxBet, step, presets, disabled, onChange }: BetControlsProps) {
  const clamp = (value: number) => Math.min(maxBet, Math.max(minBet, value));

  return (
    <div className="cfs-bet">
      <p className="cfs-bet-label">Bet Amount</p>
      <div className="cfs-bet-row">
        <button
          type="button"
          className="cfs-metal-btn"
          disabled={disabled || bet <= minBet}
          onClick={() => {
            fruitSlotsAudio.play('click');
            onChange(clamp(bet - step));
          }}
          aria-label="Decrease bet"
        >
          <Minus className="w-4 h-4" />
        </button>
        <strong className="cfs-bet-readout" aria-live="polite">
          {bet}
        </strong>
        <button
          type="button"
          className="cfs-metal-btn"
          disabled={disabled || bet >= maxBet}
          onClick={() => {
            fruitSlotsAudio.play('click');
            onChange(clamp(bet + step));
          }}
          aria-label="Increase bet"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="cfs-presets">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`cfs-preset${preset === bet ? ' is-active' : ''}`}
            disabled={disabled}
            onClick={() => {
              fruitSlotsAudio.play('click');
              onChange(preset);
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
