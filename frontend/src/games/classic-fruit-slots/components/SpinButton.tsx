'use client';

interface SpinButtonProps {
  disabled: boolean;
  spinning: boolean;
  onSpin: () => void;
}

export function SpinButton({ disabled, spinning, onSpin }: SpinButtonProps) {
  return (
    <button
      type="button"
      className={`cfs-spin${spinning ? ' is-spinning' : ''}`}
      disabled={disabled}
      aria-label={spinning ? 'Reels spinning' : 'Spin reels'}
      onClick={onSpin}
    >
      <span className="cfs-spin-ring" />
      <span className="cfs-spin-face">
        <span className="cfs-spin-label">{spinning ? 'GOOD LUCK' : 'SPIN'}</span>
      </span>
    </button>
  );
}
