export interface GameState {
  board: unknown;
  currentPlayer: string;
  players: string[];
  status: 'waiting' | 'playing' | 'finished' | 'draw';
  winner: string | null;
  moveHistory: GameMove[];
  metadata: Record<string, unknown>;
}

export interface GameMove {
  player: string;
  action: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export abstract class GameEngine {
  protected state: GameState;

  constructor(players: string[]) {
    this.state = {
      board: null,
      currentPlayer: players[0],
      players,
      status: 'waiting',
      winner: null,
      moveHistory: [],
      metadata: {},
    };
  }

  abstract initGame(): void;
  abstract makeMove(player: string, move: Record<string, unknown>): boolean;
  abstract validateMove(player: string, move: Record<string, unknown>): boolean;
  abstract checkWin(): string | null;
  abstract checkDraw(): boolean;
  abstract getValidMoves(player: string): Record<string, unknown>[];

  getGameState(): GameState {
    return { ...this.state };
  }

  /** Override to hide private information from other players. */
  getAuthorizedState(_viewerId: string | null): GameState {
    return this.getGameState();
  }

  protected addMoveToHistory(player: string, action: string, data: Record<string, unknown>): void {
    this.state.moveHistory.push({ player, action, data, timestamp: new Date() });
  }

  protected switchPlayer(): void {
    const currentIndex = this.state.players.indexOf(this.state.currentPlayer);
    this.state.currentPlayer = this.state.players[(currentIndex + 1) % this.state.players.length];
  }

  protected endGame(winner: string | null): void {
    this.state.status = winner ? 'finished' : 'draw';
    this.state.winner = winner;
  }

  isGameOver(): boolean {
    return this.state.status === 'finished' || this.state.status === 'draw';
  }

  getCurrentPlayer(): string {
    return this.state.currentPlayer;
  }

  addPlayer(_playerId: string): boolean {
    return false;
  }

  eliminatePlayer(_playerId: string): void {
    // Games that support mid-match drop-out override this
  }
}
