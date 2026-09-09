'use client';

import Link from 'next/link';
import { Home, RotateCcw, Search, Swords } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CHESS_BRAND } from '../brand';
import type { ChessResultStats } from '../types';

interface ChessResultDialogProps {
  open: boolean;
  stats: ChessResultStats | null;
  onAgain: () => void;
  onNewGame: () => void;
  onAnalyze: () => void;
}

export function ChessResultDialog({ open, stats, onAgain, onNewGame, onAnalyze }: ChessResultDialogProps) {
  if (!stats) return null;
  const title = stats.outcome === 'win' ? 'You won' : stats.outcome === 'loss' ? 'Game over' : 'Draw';
  const subtitle =
    stats.reason === 'checkmate'
      ? 'Checkmate'
      : stats.reason === 'stalemate'
        ? 'Stalemate'
        : stats.reason === 'timeout'
          ? 'Flag fell'
          : stats.reason === 'resign'
            ? 'Resignation'
            : 'Game drawn';

  return (
    <Modal isOpen={open} onClose={onNewGame} showClose={false} size="sm">
      <div className="text-center py-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-theme-muted font-semibold">{subtitle}</p>
        <h2 className="font-display text-3xl font-bold text-theme-primary mt-1 mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Stat label="Moves" value={String(stats.moves)} />
          <Stat label="Captures" value={String(stats.captures)} />
          <Stat label="Duration" value={`${Math.floor(stats.durationMs / 1000)}s`} />
          <Stat
            label="Rating"
            value={
              stats.eloChange == null
                ? '—'
                : `${stats.eloChange > 0 ? '+' : ''}${stats.eloChange}`
            }
          />
          {stats.coins != null && <Stat label="Coins" value={`+${stats.coins}`} />}
          {stats.xp != null && <Stat label="XP" value={`+${stats.xp}`} />}
        </div>
        <p className="text-xs text-theme-muted mb-5">
          Engine analysis is ready to connect. No estimated accuracy is shown.
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={onAgain}>
            Play again
          </Button>
          <Button variant="secondary" leftIcon={<Swords className="w-4 h-4" />} onClick={onNewGame}>
            New game
          </Button>
          <Button variant="outline" leftIcon={<Search className="w-4 h-4" />} onClick={onAnalyze}>
            Analyze game
          </Button>
          <Link href="/games" className="w-full">
            <Button variant="ghost" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Home
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-theme bg-theme-secondary px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-theme-muted">{label}</p>
      <p className="font-display font-semibold text-theme-primary">{value}</p>
      {label === 'Home' && <span className="sr-only">{CHESS_BRAND.name}</span>}
    </div>
  );
}
