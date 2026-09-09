import { GameErrorPayload } from './types';

export const GAME_ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_NOT_REGISTERED: 'GAME_NOT_REGISTERED',
  GAME_NOT_ACTIVE: 'GAME_NOT_ACTIVE',
  PLAYER_NOT_IN_GAME: 'PLAYER_NOT_IN_GAME',
  ACTION_NOT_ALLOWED: 'ACTION_NOT_ALLOWED',
  DUPLICATE_ACTION: 'DUPLICATE_ACTION',
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_TIMESTAMP: 'INVALID_TIMESTAMP',
  RATE_LIMITED: 'RATE_LIMITED',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  REDIS_UNAVAILABLE: 'REDIS_UNAVAILABLE',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
} as const;

export type GameErrorCode = (typeof GAME_ERROR_CODES)[keyof typeof GAME_ERROR_CODES];

export class GameError extends Error {
  public readonly code: GameErrorCode;
  public readonly gameId?: string;
  public readonly roomId?: string;
  public readonly actionId?: string;

  constructor(
    code: GameErrorCode,
    message: string,
    extras: { gameId?: string; roomId?: string; actionId?: string } = {}
  ) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.gameId = extras.gameId;
    this.roomId = extras.roomId;
    this.actionId = extras.actionId;
  }

  toPayload(): GameErrorPayload {
    return {
      code: this.code,
      message: this.message,
      gameId: this.gameId,
      roomId: this.roomId,
      actionId: this.actionId,
    };
  }
}

export const publicGameErrorMessage = (error: unknown, fallback = 'Game request failed'): string => {
  if (error instanceof GameError) return error.message;
  return fallback;
};
