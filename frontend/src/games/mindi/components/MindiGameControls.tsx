'use client';

import { Flag } from 'lucide-react';

interface MindiGameControlsProps {
  canSurrender?: boolean;
  onSurrender?: () => void;
}

export function MindiGameControls({ canSurrender, onSurrender }: MindiGameControlsProps) {
  return (
    <div className="mindi-actions">
      <button
        type="button"
        className="mindi-surrender"
        onClick={onSurrender}
        disabled={!canSurrender}
      >
        <Flag className="w-3.5 h-3.5" />
        Surrender
      </button>
    </div>
  );
}
