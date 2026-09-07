'use client';

import { COIL_MODES } from '../config';
import type { CoilMode } from '../types';

interface ModesScreenProps {
  current: CoilMode;
  onBack: () => void;
  onSelect: (mode: CoilMode) => void;
}

export function ModesScreen({ current, onBack, onSelect }: ModesScreenProps) {
  return (
    <section className="coil-screen">
      <button type="button" className="coil-back" onClick={onBack}>Back</button>
      <h2>Choose a current</h2>
      <div className="coil-mode-grid">
        {COIL_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={`coil-mode-card ${current === mode.id ? 'is-on' : ''}`}
            onClick={() => onSelect(mode.id)}
          >
            <strong>{mode.name}</strong>
            <p>{mode.blurb}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
