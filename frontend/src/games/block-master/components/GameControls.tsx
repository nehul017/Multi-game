'use client';

import { useRef, type PointerEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronsDown,
  RotateCw,
  Square,
} from 'lucide-react';

interface GameControlsProps {
  disabled?: boolean;
  canHold?: boolean;
  onLeft: () => void;
  onRight: () => void;
  onRotate: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onHold: () => void;
}

const REPEAT_DELAY = 160;
const REPEAT_MS = 45;

export function GameControls({
  disabled = false,
  canHold = true,
  onLeft,
  onRight,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onHold,
}: GameControlsProps) {
  const timers = useRef<Record<string, number>>({});

  const stopRepeat = (key: string) => {
    const handle = timers.current[key];
    if (handle) window.clearInterval(handle);
    delete timers.current[key];
  };

  const startRepeat = (key: string, action: () => void) => {
    if (disabled) return;
    action();
    stopRepeat(key);
    const started = Date.now();
    timers.current[key] = window.setInterval(() => {
      if (Date.now() - started < REPEAT_DELAY) return;
      action();
    }, REPEAT_MS);
  };

  const bindRepeat = (key: string, action: () => void) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      startRepeat(key, action);
    },
    onPointerUp: () => stopRepeat(key),
    onPointerCancel: () => stopRepeat(key),
    onLostPointerCapture: () => stopRepeat(key),
  });

  return (
    <div className="bm-controls" aria-label="Touch controls">
      <button
        type="button"
        className="bm-pad"
        aria-label="Move left"
        disabled={disabled}
        onContextMenu={(event) => event.preventDefault()}
        {...bindRepeat('left', onLeft)}
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        <span>Left</span>
      </button>
      <button
        type="button"
        className="bm-pad"
        aria-label="Rotate piece"
        disabled={disabled}
        onContextMenu={(event) => event.preventDefault()}
        onClick={onRotate}
      >
        <RotateCw className="w-5 h-5" aria-hidden="true" />
        <span>Rotate</span>
      </button>
      <button
        type="button"
        className="bm-pad"
        aria-label="Move right"
        disabled={disabled}
        onContextMenu={(event) => event.preventDefault()}
        {...bindRepeat('right', onRight)}
      >
        <ArrowRight className="w-5 h-5" aria-hidden="true" />
        <span>Right</span>
      </button>
      <button
        type="button"
        className="bm-pad"
        aria-label="Soft drop"
        disabled={disabled}
        onContextMenu={(event) => event.preventDefault()}
        {...bindRepeat('soft', onSoftDrop)}
      >
        <ArrowDown className="w-5 h-5" aria-hidden="true" />
        <span>Soft</span>
      </button>
      <button
        type="button"
        className="bm-pad"
        aria-label="Hold piece"
        disabled={disabled || !canHold}
        onClick={onHold}
      >
        <Square className="w-5 h-5" aria-hidden="true" />
        <span>Hold</span>
      </button>
      <button
        type="button"
        className="bm-pad bm-pad-accent"
        aria-label="Hard drop"
        disabled={disabled}
        onClick={onHardDrop}
      >
        <ChevronsDown className="w-5 h-5" aria-hidden="true" />
        <span>Drop</span>
      </button>
    </div>
  );
}
