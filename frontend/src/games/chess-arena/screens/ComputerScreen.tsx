'use client';

import { CHESS_DIFFICULTIES, CHESS_TIMES } from '../config';
import { chessAudio } from '../audio/chessAudio';
import type { ChessDifficulty } from '../types';

interface ComputerScreenProps {
  onBack: () => void;
  onSelect: (difficulty: ChessDifficulty, seconds: number) => void;
}

export function ComputerScreen({ onBack, onSelect }: ComputerScreenProps) {
  return (
    <section className="cx-screen">
      <button type="button" className="cx-back" onClick={onBack}>Back</button>
      <h2>vs Computer</h2>
      <p className="text-theme-muted mb-5">A search-based opponent — not random moves.</p>
      <div className="cx-card-grid">
        {CHESS_DIFFICULTIES.map((diff) => (
          <div key={diff.id} className="cx-mode-card">
            <strong>{diff.name}</strong>
            <p>{diff.blurb}</p>
            <button
              type="button"
              className="cx-cta"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                chessAudio.play('click');
                onSelect(diff.id, 300);
              }}
            >
              Play {diff.name}
            </button>
            <div className="flex flex-wrap gap-2 mt-3">
              {CHESS_TIMES.map((time) => (
                <button
                  key={time.id}
                  type="button"
                  className="cx-chip-btn"
                  onClick={() => {
                    chessAudio.play('click');
                    onSelect(diff.id, time.seconds);
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
