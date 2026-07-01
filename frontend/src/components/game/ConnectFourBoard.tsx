'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ConnectFourBoardProps {
  onGameEnd?: (winner: string | null) => void;
  onMove?: (position: { row: number; col: number } | number) => void;
  board?: unknown;
  disabled?: boolean;
}

type Cell = 'red' | 'yellow' | null;
const ROWS = 6;
const COLS = 7;

export function ConnectFourBoard({ onGameEnd, onMove, board: externalBoard, disabled }: ConnectFourBoardProps) {
  const [board, setBoard] = useState<Cell[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [isRedTurn, setIsRedTurn] = useState(true);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);

  const checkWinner = (b: Cell[][], row: number, col: number): [number, number][] | null => {
    const color = b[row][col];
    if (!color) return null;

    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      const cells: [number, number][] = [[row, col]];
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && b[r][c] === color) {
          cells.push([r, c]);
        } else break;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && b[r][c] === color) {
          cells.push([r, c]);
        } else break;
      }
      if (cells.length >= 4) return cells;
    }
    return null;
  };

  const dropDisc = (col: number) => {
    if (disabled || winningCells.length > 0) return;

    if (onMove) {
      onMove(col);
      return;
    }

    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) { row = r; break; }
    }
    if (row === -1) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = isRedTurn ? 'red' : 'yellow';
    setBoard(newBoard);

    const winning = checkWinner(newBoard, row, col);
    if (winning) {
      setWinningCells(winning);
      onGameEnd?.(isRedTurn ? 'player1' : 'player2');
      return;
    }

    if (newBoard[0].every((cell) => cell !== null)) {
      onGameEnd?.(null);
      return;
    }

    setIsRedTurn(!isRedTurn);
  };

  const isWinningCell = (row: number, col: number) =>
    winningCells.some(([r, c]) => r === row && c === col);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {winningCells.length > 0 ? (
          <span className="text-accent-green">
            {board[winningCells[0][0]][winningCells[0][1]] === 'red' ? 'Red' : 'Yellow'} wins!
          </span>
        ) : (
          <span>
            Turn: <span className={isRedTurn ? 'text-red-400' : 'text-yellow-400'}>{isRedTurn ? 'Red' : 'Yellow'}</span>
          </span>
        )}
      </div>

      <div className="bg-surface-light/80 p-3 rounded-2xl border border-surface-lighter/50">
        {/* Column indicators */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {Array(COLS).fill(null).map((_, col) => (
            <button
              key={col}
              onMouseEnter={() => setHoverCol(col)}
              onMouseLeave={() => setHoverCol(null)}
              onClick={() => dropDisc(col)}
              disabled={disabled || winningCells.length > 0 || board[0][col] !== null}
              className="h-6 flex items-center justify-center"
            >
              {hoverCol === col && !board[0][col] && !disabled && winningCells.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full',
                    isRedTurn ? 'bg-red-500' : 'bg-yellow-500'
                  )}
                />
              )}
            </button>
          ))}
        </div>

        {/* Board */}
        <div className="grid grid-rows-6 gap-1.5">
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7 gap-1.5">
              {row.map((cell, colIdx) => (
                <button
                  key={colIdx}
                  onClick={() => dropDisc(colIdx)}
                  disabled={disabled || winningCells.length > 0}
                  className={cn(
                    'w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200',
                    'bg-background/50',
                    isWinningCell(rowIdx, colIdx) && 'ring-2 ring-accent-green ring-offset-2 ring-offset-surface-light',
                    !cell && 'border-surface-lighter/30 hover:border-primary-500/30 cursor-pointer'
                  )}
                >
                  {cell && (
                    <motion.div
                      initial={{ y: -(rowIdx + 1) * 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                      className={cn(
                        'w-full h-full rounded-full',
                        cell === 'red' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
