'use client';

import type { HudSnapshot } from '../types';

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface GameHUDProps {
  hud: HudSnapshot;
  onPause: () => void;
}

export function GameHUD({ hud, onPause }: GameHUDProps) {
  const lowTime = hud.timeLeft <= 10;
  const lowAmmo = hud.magazine <= 2 && hud.reserve <= 0;
  const cleared = hud.bottlesTotal - hud.bottlesLeft;

  return (
    <div className="bs-hud" aria-live="polite">
      <div className="bs-badge bs-hud-tl">
        <div>
          <span>Level</span>
          <strong>{hud.level} / 8</strong>
        </div>
      </div>
      <div className={`bs-badge bs-hud-tc${lowTime ? ' is-pulse' : ''}`}>
        <div>
          <span>Time</span>
          <strong className={lowTime ? 'is-warn' : undefined}>{formatTime(hud.timeLeft)}</strong>
        </div>
      </div>
      <div className="bs-badge bs-hud-tr">
        <div>
          <span>Score</span>
          <strong className="bs-score-num">{hud.score.toLocaleString('en-US')}</strong>
        </div>
      </div>
      <div className="bs-badge bs-hud-bl">
        <div>
          <span>Accuracy</span>
          <strong>{hud.accuracy}%</strong>
        </div>
      </div>
      <div className="bs-badge bs-hud-bottles">
        <div>
          <span>Targets</span>
          <strong>
            {cleared} / {hud.bottlesTotal}
          </strong>
        </div>
      </div>
      <div className={`bs-badge bs-hud-br${lowAmmo ? ' is-pulse' : ''}`}>
        <div>
          <span>Ammo</span>
          <strong className={hud.magazine === 0 ? 'is-warn' : undefined}>
            {hud.magazine} / {hud.reserve}
          </strong>
          {hud.reloadHint && <em className="bs-reload-hint">Reload · R</em>}
          {hud.reloading && <em className="bs-reloading">Reloading…</em>}
        </div>
      </div>
      {hud.combo >= 2 && (
        <div className={`bs-combo${hud.combo >= 4 ? ' is-hot' : ''}`} key={hud.combo}>
          <em className="bs-combo-label">COMBO</em>
          <span>x{Math.min(hud.combo, 5)}</span>
        </div>
      )}
      <button type="button" className="bs-pause-btn" onClick={onPause} aria-label="Pause">
        <span />
        <span />
      </button>
    </div>
  );
}
