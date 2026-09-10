'use client';

interface MobileControlsProps {
  onFire: () => void;
  onReload: () => void;
  reloading: boolean;
  canFire: boolean;
  onPause: () => void;
}

export function MobileControls({ onFire, onReload, reloading, canFire, onPause }: MobileControlsProps) {
  return (
    <div className="bs-mobile">
      <button
        type="button"
        className="bs-mob-btn bs-mob-pause"
        onClick={onPause}
        aria-label="Pause"
      >
        ❚❚
      </button>
      <button
        type="button"
        className="bs-mob-btn bs-mob-reload"
        onClick={onReload}
        disabled={reloading}
      >
        {reloading ? '···' : 'R'}
      </button>
      <button
        type="button"
        className="bs-mob-btn bs-mob-fire"
        onClick={onFire}
        disabled={!canFire || reloading}
      >
        FIRE
      </button>
    </div>
  );
}
