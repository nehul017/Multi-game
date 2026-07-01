'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, RotateCcw, Home } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface GameOverModalProps {
  isOpen: boolean;
  winner: string | null;
  currentUser: string;
  eloChange: number;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function GameOverModal({ isOpen, winner, currentUser, eloChange, onPlayAgain, onClose }: GameOverModalProps) {
  const isWin = winner === currentUser || winner === 'player1';
  const isDraw = winner === null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          className="mb-6"
        >
          {isWin && !isDraw && (
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-yellow-400" />
            </div>
          )}
          {!isWin && !isDraw && (
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <TrendingDown className="w-10 h-10 text-red-400" />
            </div>
          )}
          {isDraw && (
            <div className="w-20 h-20 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto">
              <Minus className="w-10 h-10 text-gray-400" />
            </div>
          )}
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {isDraw ? 'Draw!' : isWin ? 'Victory!' : 'Defeat'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isDraw ? 'The game ended in a draw' : isWin ? 'Congratulations on your win!' : 'Better luck next time!'}
        </p>

        <div className="flex items-center justify-center gap-6 mb-8 p-4 rounded-xl bg-surface-light/50">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">ELO Change</p>
            <p className={`text-lg font-bold flex items-center justify-center gap-1 ${eloChange > 0 ? 'text-green-400' : eloChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {eloChange > 0 ? <TrendingUp className="w-4 h-4" /> : eloChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              {eloChange > 0 ? '+' : ''}{eloChange}
            </p>
          </div>
          <div className="w-px h-10 bg-surface-lighter" />
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">XP Gained</p>
            <p className="text-lg font-bold text-primary-400">+{isDraw ? 10 : isWin ? 25 : 5}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={onPlayAgain}>
            Play Again
          </Button>
          <Link href="/games" className="flex-1">
            <Button variant="outline" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Lobby
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
