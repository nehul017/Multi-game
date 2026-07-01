'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ChessBoardProps {
  onGameEnd?: (winner: string | null) => void;
  onMove?: (position: { row: number; col: number } | number) => void;
  board?: unknown;
  disabled?: boolean;
}

type Piece = string | null;

const initialBoard: Piece[][] = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

const whitePieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
const blackPieces = ['♚', '♛', '♜', '♝', '♞', '♟'];

export function ChessBoard({ onGameEnd, onMove, board: _externalBoard, disabled }: ChessBoardProps) {
  const [board, setBoard] = useState<Piece[][]>(initialBoard.map((row) => [...row]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);

  const isOwnPiece = (row: number, col: number): boolean => {
    const piece = board[row][col];
    if (!piece) return false;
    if (isWhiteTurn) return whitePieces.includes(piece);
    return blackPieces.includes(piece);
  };

  const getBasicMoves = (row: number, col: number): [number, number][] => {
    const piece = board[row][col];
    if (!piece) return [];

    const moves: [number, number][] = [];
    const isWhite = whitePieces.includes(piece);

    if (piece === '♙' || piece === '♟') {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      if (row + dir >= 0 && row + dir < 8 && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      for (const dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]) {
          const target = board[nr][nc]!;
          const targetIsWhite = whitePieces.includes(target);
          if (targetIsWhite !== isWhite) moves.push([nr, nc]);
        }
      }
    }

    if (piece === '♖' || piece === '♜' || piece === '♕' || piece === '♛') {
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row + dr * i, nc = col + dc * i;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          if (!board[nr][nc]) { moves.push([nr, nc]); continue; }
          const targetIsWhite = whitePieces.includes(board[nr][nc]!);
          if (targetIsWhite !== isWhite) moves.push([nr, nc]);
          break;
        }
      }
    }

    if (piece === '♗' || piece === '♝' || piece === '♕' || piece === '♛') {
      for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row + dr * i, nc = col + dc * i;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          if (!board[nr][nc]) { moves.push([nr, nc]); continue; }
          const targetIsWhite = whitePieces.includes(board[nr][nc]!);
          if (targetIsWhite !== isWhite) moves.push([nr, nc]);
          break;
        }
      }
    }

    if (piece === '♘' || piece === '♞') {
      for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (!board[nr][nc] || whitePieces.includes(board[nr][nc]!) !== isWhite) {
            moves.push([nr, nc]);
          }
        }
      }
    }

    if (piece === '♔' || piece === '♚') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!board[nr][nc] || whitePieces.includes(board[nr][nc]!) !== isWhite) {
              moves.push([nr, nc]);
            }
          }
        }
      }
    }

    return moves;
  };

  const handleClick = (row: number, col: number) => {
    if (disabled) return;

    if (selected) {
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
      if (isValidMove) {
        if (onMove) {
          onMove({ row, col });
          setSelected(null);
          setValidMoves([]);
          return;
        }

        const newBoard = board.map((r) => [...r]);
        const capturedPiece = newBoard[row][col];
        newBoard[row][col] = newBoard[selected[0]][selected[1]];
        newBoard[selected[0]][selected[1]] = null;
        setBoard(newBoard);
        setLastMove({ from: selected, to: [row, col] });
        setSelected(null);
        setValidMoves([]);
        setIsWhiteTurn(!isWhiteTurn);

        if (capturedPiece === '♔') onGameEnd?.('player2');
        else if (capturedPiece === '♚') onGameEnd?.('player1');
        return;
      }

      if (isOwnPiece(row, col)) {
        setSelected([row, col]);
        setValidMoves(getBasicMoves(row, col));
        return;
      }

      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (isOwnPiece(row, col)) {
      setSelected([row, col]);
      setValidMoves(getBasicMoves(row, col));
    }
  };

  const isValidMoveCell = (row: number, col: number) =>
    validMoves.some(([r, c]) => r === row && c === col);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-medium text-gray-300 mb-2">
        Turn: <span className={isWhiteTurn ? 'text-white' : 'text-gray-400'}>{isWhiteTurn ? 'White' : 'Black'}</span>
      </div>

      <div className="border-2 border-surface-lighter rounded-lg overflow-hidden">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((cell, colIdx) => {
              const isDark = (rowIdx + colIdx) % 2 === 1;
              const isSelected = selected?.[0] === rowIdx && selected?.[1] === colIdx;
              const isLastMoveFrom = lastMove?.from[0] === rowIdx && lastMove?.from[1] === colIdx;
              const isLastMoveTo = lastMove?.to[0] === rowIdx && lastMove?.to[1] === colIdx;
              const isValid = isValidMoveCell(rowIdx, colIdx);

              return (
                <button
                  key={colIdx}
                  onClick={() => handleClick(rowIdx, colIdx)}
                  className={cn(
                    'w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-2xl md:text-3xl relative transition-all',
                    isDark ? 'bg-surface-lighter/60' : 'bg-surface-light/40',
                    isSelected && 'bg-primary-500/40',
                    (isLastMoveFrom || isLastMoveTo) && 'bg-yellow-500/20',
                    !disabled && 'cursor-pointer hover:brightness-125'
                  )}
                >
                  {isValid && !cell && (
                    <span className="absolute w-3 h-3 rounded-full bg-primary-500/40" />
                  )}
                  {isValid && cell && (
                    <span className="absolute inset-0 ring-2 ring-inset ring-primary-500/50 rounded-sm" />
                  )}
                  {cell && <span className="relative z-10">{cell}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span>Click a piece to select, then click destination</span>
      </div>
    </div>
  );
}
