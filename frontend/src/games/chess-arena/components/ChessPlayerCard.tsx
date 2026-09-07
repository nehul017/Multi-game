'use client';

import { Avatar } from '@/components/ui/Avatar';
import { ChessPieceIcon } from '@/components/game/chess/ChessPiece';
import { cn } from '@/lib/utils';
import { PIECE_VALUES } from '../config';
import type { ChessColor, ChessGrid, ChessPieceType, ChessPlayerInfo } from '../types';
import { ChessClock } from './ChessClock';

const START: Record<ChessPieceType, number> = {
  king: 1,
  queen: 1,
  rook: 2,
  bishop: 2,
  knight: 2,
  pawn: 8,
};
const ORDER: ChessPieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

function capturedOf(board: ChessGrid, color: ChessColor): ChessPieceType[] {
  const counts: Record<ChessPieceType, number> = { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 };
  for (const row of board) {
    for (const cell of row) {
      if (cell?.color === color) counts[cell.type] += 1;
    }
  }
  const out: ChessPieceType[] = [];
  for (const type of ORDER) {
    for (let i = 0; i < Math.max(0, START[type] - counts[type]); i++) out.push(type);
  }
  return out;
}

function material(board: ChessGrid, color: ChessColor) {
  let score = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell?.color === color) score += PIECE_VALUES[cell.type] || 0;
    }
  }
  return score;
}

interface ChessPlayerCardProps {
  player: ChessPlayerInfo;
  board: ChessGrid;
  seconds: number;
  active?: boolean;
  showCaptured?: boolean;
  compact?: boolean;
}

export function ChessPlayerCard({ player, board, seconds, active, showCaptured = true, compact }: ChessPlayerCardProps) {
  const captured = capturedOf(board, player.color === 'white' ? 'black' : 'white');
  const advantage = material(board, player.color) - material(board, player.color === 'white' ? 'black' : 'white');

  return (
    <div className={cn('cx-player', active && 'is-active', compact && 'is-compact')}>
      <Avatar src={player.avatar} name={player.username} size={compact ? 'sm' : 'md'} online={active} floating={active} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-display font-semibold text-theme-primary truncate">{player.username}</p>
          {player.isBot && <span className="cx-chip">AI</span>}
        </div>
        <p className="text-xs text-theme-muted">
          {player.rating} · {player.color === 'white' ? 'White' : 'Black'}
          {player.level ? ` · Lv ${player.level}` : ''}
        </p>
        {showCaptured && (
          <div className="flex flex-wrap items-center gap-0.5 mt-1 min-h-[18px]">
            {captured.map((type, i) => (
              <ChessPieceIcon key={`${type}-${i}`} type={type} color={player.color === 'white' ? 'black' : 'white'} className="w-4 h-4" />
            ))}
            {advantage > 0 && <span className="text-[11px] font-semibold text-theme-success ml-1">+{advantage}</span>}
          </div>
        )}
      </div>
      <ChessClock seconds={seconds} active={active} compact={compact} />
    </div>
  );
}
