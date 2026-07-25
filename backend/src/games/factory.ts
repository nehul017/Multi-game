import { GameEngine } from './engine';
import { TicTacToe } from './tic-tac-toe';
import { ConnectFour } from './connect-four';
import { Chess } from './chess';
import { SnakeMultiplayer } from './snake-multiplayer';
import { Ludo } from './ludo';
import { QuizBattle } from './quiz-battle';

export const createGameEngine = (gameType: string, players: string[]): GameEngine | null => {
  switch (gameType) {
    case 'tic-tac-toe':
      return new TicTacToe(players);
    case 'connect-four':
      return new ConnectFour(players);
    case 'chess':
      return new Chess(players);
    case 'snake-multiplayer':
      return new SnakeMultiplayer(players);
    case 'ludo':
      return new Ludo(players);
    case 'quiz-battle':
      return new QuizBattle(players);
    default:
      return null;
  }
};

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
