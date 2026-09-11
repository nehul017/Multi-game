'use client';

import { Settings, Volume2, VolumeX } from 'lucide-react';

interface CarromHeaderProps {
  muted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  playersLabel?: string;
  variantLabel?: string;
  pointsLabel?: string;
}

export function CarromHeader({
  muted,
  onToggleMute,
  onOpenSettings,
  playersLabel = '2 Players',
  variantLabel = 'Standard',
  pointsLabel = '5 Points',
}: CarromHeaderProps) {
  return (
    <header className="carrom-header">
      <div className="carrom-brand">
        <span className="carrom-crown" aria-hidden>
          ♔
        </span>
        <div>
          <p className="carrom-brand-title">CARROM</p>
          <p className="carrom-brand-sub">CLASSIC</p>
        </div>
      </div>

      <div className="carrom-pills" aria-label="Match rules">
        <span className="carrom-pill">
          <svg viewBox="0 0 24 24" className="carrom-pill-icon" aria-hidden>
            <circle cx="9" cy="8" r="3" fill="currentColor" />
            <circle cx="16" cy="9" r="2.4" fill="currentColor" />
            <path d="M4 18c.6-3 2.8-4.5 5-4.5s4.4 1.5 5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M13.2 18c.4-2.2 1.8-3.3 3.3-3.3 1.4 0 2.7 1 3.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          {playersLabel}
        </span>
        <span className="carrom-pill">
          <span className="carrom-pill-target" aria-hidden />
          {variantLabel}
        </span>
        <span className="carrom-pill">
          <span className="carrom-pill-star" aria-hidden>
            ★
          </span>
          {pointsLabel}
        </span>
      </div>

      <div className="carrom-header-tools">
        <button type="button" className="carrom-icon-btn" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button type="button" className="carrom-icon-btn" onClick={onOpenSettings} aria-label="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
