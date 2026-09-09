'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, RotateCcw, Home, Coins, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import { toId } from '@/lib/id';
import toast from 'react-hot-toast';

interface GameOverModalProps {
  isOpen: boolean;
  winner: string | null;
  currentUser: string;
  eloChange: number;
  xpGained?: number;
  coinsEarned?: number;
  username?: string;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function GameOverModal({
  isOpen,
  winner,
  currentUser,
  eloChange,
  xpGained,
  coinsEarned,
  username,
  onPlayAgain,
  onClose,
}: GameOverModalProps) {
  const reduce = useReducedMotion();
  const isWin = !!winner && toId(winner) === toId(currentUser);
  const isDraw = !winner;
  const xp = xpGained;
  const coins = coinsEarned;
  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: `${6 + ((i * 17) % 88)}%`,
        delay: (i % 8) * 0.08,
        color: ['#8b5cf6', '#a78bfa', '#f59e0b', '#34d399', '#f472b6', '#38bdf8'][i % 6],
      })),
    []
  );

  const handleShare = async () => {
    const text = isDraw
      ? 'Draw on MultiGame!'
      : isWin
        ? `I won on MultiGame! +${eloChange} ELO`
        : 'Tough match on MultiGame — rematch incoming.';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MultiGame', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Result copied');
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="relative text-center py-4 overflow-hidden">
        {isWin && !isDraw && !reduce && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c) => (
              <motion.span
                key={c.id}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={{ y: 320, opacity: [0, 1, 1, 0], rotate: 360 }}
                transition={{ duration: 2.4, delay: c.delay, ease: 'easeOut' }}
                className="absolute top-0 w-2 h-3 rounded-sm"
                style={{ left: c.left, background: c.color }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={reduce ? false : { scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 140 }}
          className="mb-5 relative z-[1]"
        >
          {username && (
            <div className="mb-3 flex justify-center">
              <Avatar name={username} size="lg" floating={isWin && !isDraw} />
            </div>
          )}
          {isWin && !isDraw && (
            <div className="w-20 h-20 rounded-full bg-theme-warning/15 flex items-center justify-center mx-auto border border-theme-warning/30 shadow-[0_0_32px_rgba(245,158,11,0.25)]">
              <Trophy className="w-10 h-10 text-theme-warning" />
            </div>
          )}
          {!isWin && !isDraw && (
            <div className="w-20 h-20 rounded-full bg-theme-danger/15 flex items-center justify-center mx-auto border border-theme-danger/30">
              <TrendingDown className="w-10 h-10 text-theme-danger" />
            </div>
          )}
          {isDraw && (
            <div className="w-20 h-20 rounded-full bg-theme-secondary flex items-center justify-center mx-auto border border-theme">
              <Minus className="w-10 h-10 text-theme-muted" />
            </div>
          )}
        </motion.div>

        <h2 className="text-2xl font-bold text-theme-primary font-display mb-2 relative z-[1]">
          {isDraw ? 'Draw!' : isWin ? 'Victory!' : 'Defeat'}
        </h2>
        <p className="text-theme-muted mb-6 relative z-[1]">
          {isDraw
            ? 'The game ended in a draw'
            : isWin
              ? 'Congratulations on your win!'
              : 'Better luck next time!'}
        </p>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl bg-theme-secondary border border-theme relative z-[1]">
          <div className="text-center min-w-0">
            <p className="text-xs text-theme-muted mb-1">ELO</p>
            <p
              className={`text-base sm:text-lg font-bold flex items-center justify-center gap-1 ${
                eloChange > 0
                  ? 'text-theme-success'
                  : eloChange < 0
                    ? 'text-theme-danger'
                    : 'text-theme-muted'
              }`}
            >
              {eloChange > 0 ? (
                <TrendingUp className="w-4 h-4 shrink-0" />
              ) : eloChange < 0 ? (
                <TrendingDown className="w-4 h-4 shrink-0" />
              ) : null}
              {eloChange > 0 ? '+' : ''}
              {eloChange}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-theme-muted mb-1">XP</p>
            <p className="text-base sm:text-lg font-bold text-primary-500">{xp != null ? `+${xp}` : '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-theme-muted mb-1">Coins</p>
            <p className="text-base sm:text-lg font-bold text-theme-warning flex items-center justify-center gap-1">
              <Coins className="w-4 h-4 shrink-0" />
              {coins != null ? `+${coins}` : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-[1]">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="flex-1"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={onPlayAgain}
            >
              Play Again
            </Button>
            <Link href="/games" className="flex-1">
              <Button variant="secondary" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
                Lobby
              </Button>
            </Link>
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
            Share result
          </Button>
        </div>
      </div>
    </Modal>
  );
}
