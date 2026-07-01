import { GameEngine } from './engine';

type TokenStatus = 'home' | 'active' | 'finished';

interface Token {
  id: number;
  position: number;
  status: TokenStatus;
  stepsFromStart: number;
}

interface LudoPlayer {
  playerId: string;
  color: string;
  tokens: Token[];
  startPosition: number;
  homeStretchStart: number;
}

const BOARD_SIZE = 52;
const HOME_STRETCH_LENGTH = 6;
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];
const COLORS = ['red', 'blue', 'green', 'yellow'];
const START_POSITIONS = [0, 13, 26, 39];

export class Ludo extends GameEngine {
  private ludoPlayers: LudoPlayer[];
  private lastDiceRoll: number = 0;
  private hasRolled: boolean = false;
  private extraTurn: boolean = false;

  constructor(players: string[]) {
    super(players.slice(0, 4));
    this.ludoPlayers = [];
    this.initGame();
  }

  initGame(): void {
    this.ludoPlayers = this.state.players.map((playerId, index) => ({
      playerId,
      color: COLORS[index],
      tokens: Array.from({ length: 4 }, (_, i) => ({
        id: i,
        position: -1,
        status: 'home' as TokenStatus,
        stepsFromStart: 0,
      })),
      startPosition: START_POSITIONS[index],
      homeStretchStart: (START_POSITIONS[index] + BOARD_SIZE - 1) % BOARD_SIZE,
    }));

    this.state.board = {
      players: this.ludoPlayers,
      boardSize: BOARD_SIZE,
      safePositions: SAFE_POSITIONS,
      lastDice: 0,
    };
    this.state.status = 'playing';
    this.state.currentPlayer = this.state.players[0];
    this.hasRolled = false;
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    if (player !== this.state.currentPlayer) return false;

    const action = move.action as string;

    if (action === 'roll') {
      return !this.hasRolled;
    }

    if (action === 'move') {
      if (!this.hasRolled) return false;
      const tokenId = move.tokenId as number;
      const ludoPlayer = this.ludoPlayers.find((p) => p.playerId === player);
      if (!ludoPlayer) return false;

      const token = ludoPlayer.tokens[tokenId];
      if (!token) return false;

      if (token.status === 'finished') return false;

      if (token.status === 'home' && this.lastDiceRoll !== 6) return false;

      if (token.status === 'active') {
        const newSteps = token.stepsFromStart + this.lastDiceRoll;
        if (newSteps > BOARD_SIZE + HOME_STRETCH_LENGTH) return false;
      }

      return true;
    }

    return false;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const action = move.action as string;

    if (action === 'roll') {
      this.lastDiceRoll = Math.floor(Math.random() * 6) + 1;
      this.hasRolled = true;
      this.extraTurn = this.lastDiceRoll === 6;

      this.addMoveToHistory(player, 'roll', { dice: this.lastDiceRoll });

      (this.state.board as Record<string, unknown>).lastDice = this.lastDiceRoll;

      const ludoPlayer = this.ludoPlayers.find((p) => p.playerId === player)!;
      const canMove = ludoPlayer.tokens.some((t) => {
        if (t.status === 'finished') return false;
        if (t.status === 'home') return this.lastDiceRoll === 6;
        return t.stepsFromStart + this.lastDiceRoll <= BOARD_SIZE + HOME_STRETCH_LENGTH;
      });

      if (!canMove) {
        this.hasRolled = false;
        this.extraTurn = false;
        this.switchPlayer();
      }

      return true;
    }

    if (action === 'move') {
      const tokenId = move.tokenId as number;
      const ludoPlayer = this.ludoPlayers.find((p) => p.playerId === player)!;
      const token = ludoPlayer.tokens[tokenId];

      if (token.status === 'home') {
        token.status = 'active';
        token.position = ludoPlayer.startPosition;
        token.stepsFromStart = 0;
      } else {
        token.stepsFromStart += this.lastDiceRoll;

        if (token.stepsFromStart >= BOARD_SIZE + HOME_STRETCH_LENGTH) {
          token.status = 'finished';
          token.position = -1;
        } else if (token.stepsFromStart >= BOARD_SIZE) {
          token.position = -1;
        } else {
          token.position = (ludoPlayer.startPosition + token.stepsFromStart) % BOARD_SIZE;
          this.checkCapture(ludoPlayer, token);
        }
      }

      this.addMoveToHistory(player, 'move', {
        tokenId,
        dice: this.lastDiceRoll,
        newPosition: token.position,
        steps: token.stepsFromStart,
      });

      this.hasRolled = false;

      const winner = this.checkWin();
      if (winner) {
        this.endGame(winner);
      } else if (this.extraTurn) {
        this.extraTurn = false;
      } else {
        this.switchPlayer();
      }

      return true;
    }

    return false;
  }

  private checkCapture(currentPlayer: LudoPlayer, movedToken: Token): void {
    if (SAFE_POSITIONS.includes(movedToken.position)) return;

    for (const otherPlayer of this.ludoPlayers) {
      if (otherPlayer.playerId === currentPlayer.playerId) continue;

      for (const otherToken of otherPlayer.tokens) {
        if (otherToken.status === 'active' && otherToken.position === movedToken.position) {
          otherToken.status = 'home';
          otherToken.position = -1;
          otherToken.stepsFromStart = 0;
          this.extraTurn = true;
        }
      }
    }
  }

  checkWin(): string | null {
    for (const ludoPlayer of this.ludoPlayers) {
      if (ludoPlayer.tokens.every((t) => t.status === 'finished')) {
        return ludoPlayer.playerId;
      }
    }
    return null;
  }

  checkDraw(): boolean {
    return false;
  }

  getValidMoves(player: string): Record<string, unknown>[] {
    const moves: Record<string, unknown>[] = [];

    if (!this.hasRolled) {
      moves.push({ action: 'roll' });
      return moves;
    }

    const ludoPlayer = this.ludoPlayers.find((p) => p.playerId === player);
    if (!ludoPlayer) return moves;

    for (const token of ludoPlayer.tokens) {
      if (this.validateMove(player, { action: 'move', tokenId: token.id })) {
        moves.push({ action: 'move', tokenId: token.id });
      }
    }

    return moves;
  }
}
