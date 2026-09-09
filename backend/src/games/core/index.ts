import { registerBuiltInGames } from './register-games';

registerBuiltInGames();

export { GAME_ERROR_CODES, GameError, publicGameErrorMessage } from './errors';
export { gameLogger } from './logger';
export {
  FILL_BOT_GAMES,
  GAME_LIMITS,
  GAME_PLAYER_LIMITS,
  HIGH_FREQUENCY_GAMES,
  JOIN_IN_PROGRESS_GAMES,
  SIMULTANEOUS_TURN_GAMES,
  maxPlayersFor,
  minPlayersToStart,
} from './limits';
export { gameRegistry } from './registry';
export { gameSessionStore } from './session-store';
export {
  createActionId,
  parseIncomingAction,
  stripUntrustedActionFields,
  validateGameAction,
} from './validator';
export type {
  GameAction,
  GameDefinition,
  GameErrorPayload,
  GameLifecycle,
  GamePlayerSlot,
  GameResult,
  GameRoom,
  GameSessionMeta,
  RemoteGameCommand,
} from './types';
