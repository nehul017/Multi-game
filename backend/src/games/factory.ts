import { GameEngine } from './engine';
import { registerBuiltInGames } from './core/register-games';
import { gameRegistry } from './core/registry';

registerBuiltInGames();

export const createGameEngine = (
  gameType: string,
  players: string[],
  settings: Record<string, unknown> = {}
): GameEngine | null => gameRegistry.createEngine(gameType, players, settings);

const deepClone = <T>(value: T): T => {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

export const serializeGameState = (engine: GameEngine) => {
  const state = engine.getGameState();
  // Deep-clone board/state so broadcasts never share live engine references
  // (Ludo/Quiz/Snake boards are objects; grid games are arrays)
  return {
    board: deepClone(state.board),
    currentPlayer: state.currentPlayer,
    currentTurn: state.currentPlayer,
    players: [...state.players],
    status: state.status,
    winner: state.winner,
    moveCount: state.moveHistory.length,
    moveHistory: deepClone(state.moveHistory),
    metadata: state.metadata ? deepClone(state.metadata) : state.metadata,
  };
};

/** Tick payload only — Socket.IO serializes on emit, so skip extra JSON clones. */
export const serializeSnakeTick = (engine: GameEngine) => {
  const state = engine.getGameState();
  return {
    board: state.board,
    currentPlayer: state.currentPlayer,
    currentTurn: state.currentPlayer,
    players: state.players,
    status: state.status,
    winner: state.winner,
    moveCount: state.moveHistory.length,
    metadata: state.metadata,
  };
};
