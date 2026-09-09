'use client';

import { Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { MindiScoreBoard } from './MindiScoreBoard';
import { MindiTrumpBadge } from './MindiTrumpBadge';
import type { MindiCompletedTrick, MindiSuit } from '../types';

interface MindiHUDProps {
  roundNumber?: number;
  teamA: { tens: number; tricks: number };
  teamB: { tens: number; tricks: number };
  trumpSuit?: MindiSuit | null;
  trumpRevealed?: boolean;
  lastTrick?: MindiCompletedTrick | null;
  muted: boolean;
  fullscreen: boolean;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
}

export function MindiHUD({
  roundNumber,
  teamA,
  teamB,
  trumpSuit,
  trumpRevealed,
  lastTrick,
  muted,
  fullscreen,
  onToggleMute,
  onToggleFullscreen,
}: MindiHUDProps) {
  return (
    <header className="mindi-hud">
      <div className="mindi-hud-brand">
        <p className="mindi-kicker">Mindi Cot</p>
        <h1>Round {roundNumber || 1}</h1>
      </div>
      <MindiScoreBoard teamA={teamA} teamB={teamB} lastTrick={lastTrick} />
      <MindiTrumpBadge suit={trumpSuit} revealed={trumpRevealed} />
      <div className="mindi-hud-tools">
        <button
          type="button"
          className="mindi-icon-btn"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          className="mindi-icon-btn"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
