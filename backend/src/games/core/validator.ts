import { GAME_ERROR_CODES, GameError } from './errors';
import { GameAction, GameRoom } from './types';
import { HIGH_FREQUENCY_GAMES, SIMULTANEOUS_TURN_GAMES } from './limits';

const MAX_ACTION_AGE_MS = 30_000;
const MAX_ACTION_FUTURE_MS = 5_000;
const TRUSTED_CLIENT_FIELDS = new Set(['score', 'winner', 'result', 'coins', 'reward', 'balance']);

export const createActionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

export const stripUntrustedActionFields = (
  payload: Record<string, unknown>
): Record<string, unknown> => {
  const clean: Record<string, unknown> = { ...payload };
  delete clean._forcedDice;
  delete clean.playerId;
  delete clean.userId;
  for (const field of TRUSTED_CLIENT_FIELDS) {
    delete clean[field];
  }
  return clean;
};

export const parseIncomingAction = (
  data: unknown
): {
  roomId: string;
  action: string;
  moveData: Record<string, unknown>;
  actionId?: string;
  timestamp?: number;
  matchId?: string;
  gameId?: string;
} | null => {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;

  const isStandard =
    typeof raw.actionId === 'string' ||
    typeof raw.type === 'string' ||
    (raw.payload && typeof raw.payload === 'object');

  if (isStandard) {
    const payload = (raw.payload as Record<string, unknown>) || {};
    const roomId = String(raw.roomId || payload.roomId || '');
    if (!roomId) return null;
    return {
      roomId,
      action: String(raw.type || raw.action || 'move'),
      moveData: stripUntrustedActionFields({ ...payload, ...(raw.moveData as Record<string, unknown> | undefined) }),
      actionId: typeof raw.actionId === 'string' ? raw.actionId : undefined,
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : undefined,
      matchId: typeof raw.matchId === 'string' ? raw.matchId : undefined,
      gameId: typeof raw.gameId === 'string' ? raw.gameId : undefined,
    };
  }

  const roomId = String(raw.roomId || '');
  if (!roomId) return null;
  return {
    roomId,
    action: String(raw.action || 'move'),
    moveData: stripUntrustedActionFields((raw.moveData as Record<string, unknown>) || {}),
    actionId: typeof raw.actionId === 'string' ? raw.actionId : undefined,
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : undefined,
  };
};

export interface ActionValidationInput {
  userId: string;
  room: GameRoom;
  action: { actionId?: string; type: string; payload: Record<string, unknown>; timestamp?: number };
  seenAction: boolean;
  now?: number;
}

export const validateGameAction = (input: ActionValidationInput): void => {
  const { userId, room, action, seenAction } = input;
  const now = input.now ?? Date.now();

  if (!userId) {
    throw new GameError(GAME_ERROR_CODES.UNAUTHENTICATED, 'Authentication required', {
      gameId: room.gameType,
      roomId: room.roomId,
      actionId: action.actionId,
    });
  }

  if (!room.players.has(userId)) {
    throw new GameError(GAME_ERROR_CODES.PLAYER_NOT_IN_GAME, 'Player is not in this game', {
      gameId: room.gameType,
      roomId: room.roomId,
      actionId: action.actionId,
    });
  }

  if (!room.engine || room.engine.isGameOver()) {
    throw new GameError(GAME_ERROR_CODES.GAME_NOT_ACTIVE, 'Game is not currently active', {
      gameId: room.gameType,
      roomId: room.roomId,
      actionId: action.actionId,
    });
  }

  if (action.actionId && seenAction) {
    throw new GameError(GAME_ERROR_CODES.DUPLICATE_ACTION, 'Duplicate action ignored', {
      gameId: room.gameType,
      roomId: room.roomId,
      actionId: action.actionId,
    });
  }

  if (typeof action.timestamp === 'number') {
    const delta = now - action.timestamp;
    if (delta > MAX_ACTION_AGE_MS || delta < -MAX_ACTION_FUTURE_MS) {
      throw new GameError(GAME_ERROR_CODES.INVALID_TIMESTAMP, 'Action timestamp is invalid', {
        gameId: room.gameType,
        roomId: room.roomId,
        actionId: action.actionId,
      });
    }
  }

  if (HIGH_FREQUENCY_GAMES.has(room.gameType) || SIMULTANEOUS_TURN_GAMES.has(room.gameType)) return;

  const current = room.engine.getCurrentPlayer();
  if (current && current !== userId) {
    throw new GameError(GAME_ERROR_CODES.ACTION_NOT_ALLOWED, 'It is not your turn', {
      gameId: room.gameType,
      roomId: room.roomId,
      actionId: action.actionId,
    });
  }
};
