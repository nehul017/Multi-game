'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, AlertTriangle, Handshake, Flag, Swords, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChessStatusKind =
  | 'white-turn'
  | 'black-turn'
  | 'check'
  | 'checkmate'
  | 'draw'
  | 'resigned'
  | 'waiting'
  | 'playing';

interface ChessStatusProps {
  status: ChessStatusKind;
  className?: string;
}

const CONFIG: Record<
  ChessStatusKind,
  { label: string; icon: typeof Crown; className: string; pulse?: boolean }
> = {
  'white-turn': {
    label: 'White to move',
    icon: CircleDot,
    className: 'border-theme text-theme-primary bg-white/40',
  },
  'black-turn': {
    label: 'Black to move',
    icon: CircleDot,
    className: 'border-theme text-theme-primary bg-black/10',
  },
  check: {
    label: 'Check!',
    icon: AlertTriangle,
    className: 'border-amber-400/40 text-amber-600 bg-amber-500/15',
    pulse: true,
  },
  checkmate: {
    label: 'Checkmate',
    icon: Crown,
    className: 'border-rose-400/40 text-rose-600 bg-rose-500/15',
    pulse: true,
  },
  draw: {
    label: 'Draw',
    icon: Handshake,
    className: 'border-sky-400/30 text-sky-600 bg-sky-500/15',
  },
  resigned: {
    label: 'Resigned',
    icon: Flag,
    className: 'border-theme text-theme-muted bg-theme-secondary/80',
  },
  waiting: {
    label: 'Waiting…',
    icon: Swords,
    className: 'border-primary-500/30 text-primary-600 bg-primary-500/10',
  },
  playing: {
    label: 'Match in progress',
    icon: Swords,
    className: 'border-emerald-400/30 text-emerald-600 bg-emerald-500/10',
  },
};

export function ChessStatus({ status, className }: ChessStatusProps) {
  const cfg = CONFIG[status] || CONFIG.playing;
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'chess-glass flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-xl',
          cfg.className,
          cfg.pulse && 'animate-pulse',
          className
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--glass-bg)] border border-theme">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">{cfg.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
