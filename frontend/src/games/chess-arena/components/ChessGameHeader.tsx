'use client';

import { ArrowLeft, FlipHorizontal2, Maximize, Minimize, Settings, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { ChessPlayMode, ConnectionStatus } from '../types';

interface ChessGameHeaderProps {
  mode: ChessPlayMode;
  statusLabel: string;
  connection: ConnectionStatus;
  muted: boolean;
  fullscreen: boolean;
  onBack: () => void;
  onSettings: () => void;
  onMute: () => void;
  onFullscreen: () => void;
  onFlip: () => void;
}

const MODE_LABEL: Record<ChessPlayMode, string> = {
  quick: 'Quick Match',
  ranked: 'Ranked',
  casual: 'Casual',
  computer: 'vs Computer',
  local: 'Local',
  private: 'Private',
};

const CONN_LABEL: Record<ConnectionStatus, string> = {
  offline: 'Local',
  connecting: 'Connecting',
  connected: 'Live',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  'opponent-disconnected': 'Opponent left',
  'opponent-reconnecting': 'Opponent reconnecting',
  finished: 'Finished',
};

export function ChessGameHeader({
  mode,
  statusLabel,
  connection,
  muted,
  fullscreen,
  onBack,
  onSettings,
  onMute,
  onFullscreen,
  onFlip,
}: ChessGameHeaderProps) {
  return (
    <header className="cx-header">
      <button type="button" className="cx-icon-btn" onClick={onBack} aria-label="Back">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-theme-muted font-semibold">{MODE_LABEL[mode]}</p>
        <p className="text-sm font-semibold text-theme-primary truncate">{statusLabel}</p>
      </div>
      <Badge variant={connection === 'connected' || connection === 'offline' ? 'success' : connection === 'finished' ? 'default' : 'warning'}>
        {CONN_LABEL[connection]}
      </Badge>
      <button type="button" className="cx-icon-btn" onClick={onFlip} aria-label="Flip board">
        <FlipHorizontal2 className="w-4 h-4" />
      </button>
      <button type="button" className="cx-icon-btn" onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'}>
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      <button type="button" className="cx-icon-btn" onClick={onSettings} aria-label="Settings">
        <Settings className="w-4 h-4" />
      </button>
      <button type="button" className="cx-icon-btn" onClick={onFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
        {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
    </header>
  );
}
