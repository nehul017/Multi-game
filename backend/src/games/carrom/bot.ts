import { GameEngine } from '../engine';
import type { CarromBoardState } from './types';

export const pickCarromBotMove = (
  engine: GameEngine,
  playerId: string
): Record<string, unknown> | null => {
  const moves = engine.getValidMoves(playerId);
  if (moves[0]) return moves[0];

  const board = engine.getGameState().board as CarromBoardState | null;
  const color = board?.colors[playerId] || 'white';
  const striker = board?.pieces.find((piece) => piece.kind === 'striker');
  return {
    action: 'shoot',
    shotId: `bot-fallback-${Date.now()}`,
    strikerX: striker?.x ?? 500,
    strikerY: striker?.y ?? (color === 'white' ? 882 : 118),
    angle: color === 'white' ? -Math.PI / 2 : Math.PI / 2,
    power: 0.58,
  };
};

export const carromBotDelayMs = (engine: GameEngine | null): number => {
  const board = engine?.getGameState().board as CarromBoardState | undefined;
  const duration = board?.lastShot?.durationMs ?? 900;
  return Math.min(14000, Math.max(700, duration + 280));
};
