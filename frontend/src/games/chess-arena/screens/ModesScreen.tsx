'use client';

import { CHESS_MODES, CHESS_TIMES } from '../config';
import { chessAudio } from '../audio/chessAudio';
import type { ChessPlayMode } from '../types';

interface ModesScreenProps {
  onBack: () => void;
  onSelect: (mode: ChessPlayMode, seconds: number) => void;
}

export function ModesScreen({ onBack, onSelect }: ModesScreenProps) {
  return (
    <section className="cx-screen">
      <button type="button" className="cx-back" onClick={onBack}>Back</button>
      <h2>Choose a clock</h2>
      <p className="text-theme-muted mb-5">Quick, ranked, or casual — same board, different stakes.</p>
      <div className="cx-card-grid">
        {CHESS_MODES.filter((m) => m.id === 'quick' || m.id === 'ranked' || m.id === 'casual').map((mode) => (
          <div key={mode.id} className="cx-mode-card">
            <strong>{mode.name}</strong>
            <p>{mode.blurb}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {CHESS_TIMES.map((time) => (
                <button
                  key={time.id}
                  type="button"
                  className="cx-chip-btn"
                  onClick={() => {
                    chessAudio.play('click');
                    onSelect(mode.id, time.seconds);
                  }}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
