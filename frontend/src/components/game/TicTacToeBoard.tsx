'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Cell = 'X' | 'O' | null;

export interface TicTacToeBoardProps {
  onGameEnd?: (winner: string | null) => void;
  onMove?: (position: { row: number; col: number } | number) => void;
  board?: unknown;
  disabled?: boolean;
}

const winLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function flattenBoard(board: unknown): Cell[] {
  if (!board) return Array(9).fill(null);
  if (Array.isArray(board) && board.length === 9 && !Array.isArray(board[0])) {
    return board as Cell[];
  }
  if (Array.isArray(board) && board.length === 3) {
    return (board as Cell[][]).flat();
  }
  return Array(9).fill(null);
}

export function TicTacToeBoard({ onGameEnd, onMove, board: externalBoard, disabled }: TicTacToeBoardProps) {
  const isServerMode = !!onMove;
  const [localBoard, setLocalBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const board = isServerMode ? flattenBoard(externalBoard) : localBoard;

  useEffect(() => {
    if (isServerMode && externalBoard) {
      const flat = flattenBoard(externalBoard);
      const result = checkWinner(flat);
      if (result) {
        setWinningLine(result.line);
      } else {
        setWinningLine(null);
      }
    }
  }, [externalBoard, isServerMode]);

  const checkWinner = (cells: Cell[]): { winner: Cell; line: number[] } | null => {
    for (const line of winLines) {
      const [a, b, c] = line;
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return { winner: cells[a], line };
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (disabled || board[index] || winningLine) return;

    if (isServerMode) {
      const row = Math.floor(index / 3);
      const col = index % 3;
      onMove({ row, col });
      return;
    }

    const newBoard = [...board];
    newBoard[index] = isXTurn ? 'X' : 'O';
    setLocalBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinningLine(result.line);
      onGameEnd?.(result.winner === 'X' ? 'player1' : 'player2');
      return;
    }

    if (newBoard.every((cell) => cell !== null)) {
      onGameEnd?.(null);
      return;
    }

    setIsXTurn(!isXTurn);
  };

  const currentMark = isServerMode
    ? (board.filter((c) => c !== null).length % 2 === 0 ? 'X' : 'O')
    : (isXTurn ? 'X' : 'O');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {winningLine ? (
          <span className="text-accent-green">
            {board[winningLine[0]]} wins!
          </span>
        ) : board.every((c) => c !== null) ? (
          <span className="text-yellow-400">Draw!</span>
        ) : (
          <span>
            Turn: <span className={currentMark === 'X' ? 'text-primary-400' : 'text-secondary-400'}>{currentMark}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => (
          <motion.button
            key={index}
            whileHover={!cell && !disabled && !winningLine ? { scale: 1.05 } : {}}
            whileTap={!cell && !disabled && !winningLine ? { scale: 0.95 } : {}}
            onClick={() => handleClick(index)}
            disabled={disabled || !!cell || !!winningLine}
            className={cn(
              'w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 flex items-center justify-center text-4xl md:text-5xl font-bold transition-all duration-200',
              'bg-surface-light/50 hover:bg-surface-light',
              winningLine?.includes(index) && 'border-accent-green bg-green-500/10 shadow-glow-green',
              !winningLine?.includes(index) && 'border-surface-lighter/50',
              !cell && !disabled && !winningLine && 'cursor-pointer hover:border-primary-500/50',
            )}
          >
            {cell && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className={cell === 'X' ? 'text-primary-400' : 'text-secondary-400'}
              >
                {cell}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
