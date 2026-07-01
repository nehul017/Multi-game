'use client';

import { TicTacToeBoard } from './TicTacToeBoard';
import { ConnectFourBoard } from './ConnectFourBoard';
import { ChessBoard } from './ChessBoard';

interface GameBoardProps {
  gameSlug: string;
  onGameEnd: (winner: string | null) => void;
  disabled?: boolean;
}

export function GameBoard({ gameSlug, onGameEnd, disabled }: GameBoardProps) {
  switch (gameSlug) {
    case 'tic-tac-toe':
      return <TicTacToeBoard onGameEnd={onGameEnd} disabled={disabled} />;
    case 'connect-four':
      return <ConnectFourBoard onGameEnd={onGameEnd} disabled={disabled} />;
    case 'chess':
      return <ChessBoard onGameEnd={onGameEnd} disabled={disabled} />;
    default:
      return <TicTacToeBoard onGameEnd={onGameEnd} disabled={disabled} />;
  }
}
