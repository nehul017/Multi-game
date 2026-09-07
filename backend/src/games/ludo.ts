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
// Classic Ludo corners: red BL, green TL, blue TR, yellow BR
const COLORS = ['red', 'green', 'blue', 'yellow'];
// Track indices for clockwise starts (see frontend TRACK):
// green=0 left [6,1], blue=13 top [1,8], yellow=26 right [8,13], red=39 bottom [13,6]
const START_POSITIONS = [39, 0, 13, 26];

export class Ludo extends GameEngine {
  private ludoPlayers: LudoPlayer[];
  private lastDiceRoll: number = 0;
  private hasRolled: boolean = false;
  private extraTurn: boolean = false;
  // Track consecutive sixes for the three-sixes rule
  private consecutiveSixes: number = 0;

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
      hasRolled: false,
    };
    this.state.status = 'playing';
    this.state.currentPlayer = this.state.players[0];
    this.hasRolled = false;
    this.consecutiveSixes = 0;
  }

  /** Keep dice/turn flags on board so all clients stay in sync */
  private syncBoardMeta(): void {
    const board = this.state.board as Record<string, unknown>;
    board.lastDice = this.lastDiceRoll;
    board.hasRolled = this.hasRolled;
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
      // `_forcedDice` is server-only (stripped from client payloads) for reconnect replay
      const forced = move._forcedDice;
      this.lastDiceRoll =
        typeof forced === 'number' && forced >= 1 && forced <= 6
          ? Math.floor(forced)
          : Math.floor(Math.random() * 6) + 1;
      this.hasRolled = true;

      // Three Sixes Rule: track consecutive 6s
      if (this.lastDiceRoll === 6) {
        this.consecutiveSixes++;
        if (this.consecutiveSixes >= 3) {
          // Third consecutive 6 — turn ends immediately, no movement allowed
          this.addMoveToHistory(player, 'roll', { dice: this.lastDiceRoll, voided: true });
          this.hasRolled = false;
          this.extraTurn = false;
          this.consecutiveSixes = 0;
          this.switchPlayer();
          this.syncBoardMeta();
          return true;
        }
        this.extraTurn = true;
      } else {
        // Non-six resets consecutive counter
        this.consecutiveSixes = 0;
        this.extraTurn = false;
      }

      this.addMoveToHistory(player, 'roll', { dice: this.lastDiceRoll });

      const ludoPlayer = this.ludoPlayers.find((p) => p.playerId === player)!;
      const canMove = ludoPlayer.tokens.some((t) => {
        if (t.status === 'finished') return false;
        if (t.status === 'home') return this.lastDiceRoll === 6;
        return t.stepsFromStart + this.lastDiceRoll <= BOARD_SIZE + HOME_STRETCH_LENGTH;
      });

      if (!canMove) {
        this.hasRolled = false;
        if (!this.extraTurn) {
          this.consecutiveSixes = 0;
          this.switchPlayer();
        }
        // If extraTurn (rolled 6 but can't move), player gets another roll
      }

      this.syncBoardMeta();
      return true;
    }

    if (action === 'move') {
      const tokenId = move.tokenId as number;
      const ludoPlayer = this.ludoPlayers.find((p) => p.playerId === player)!;
      const token = ludoPlayer.tokens[tokenId];
      let captured = false;
      let finished = false;

      if (token.status === 'home') {
        // Token enters the board at start position
        token.status = 'active';
        token.position = ludoPlayer.startPosition;
        token.stepsFromStart = 0;
        // Rule: Capture opponent on start position (start is safe in standard rules,
        // but entering specifically CAN displace in many digital implementations).
        // Since start positions are in SAFE_POSITIONS, standard rules say no capture here.
        // We still call checkCapture for correctness — it will respect safe positions.
        captured = this.checkCapture(ludoPlayer, token);
      } else {
        token.stepsFromStart += this.lastDiceRoll;

        if (token.stepsFromStart >= BOARD_SIZE + HOME_STRETCH_LENGTH) {
          // Token reaches HOME — exact count already validated
          token.status = 'finished';
          token.position = -1;
          finished = true;
        } else if (token.stepsFromStart >= BOARD_SIZE) {
          // Token is in home stretch (private path, no captures possible)
          token.position = -1;
        } else {
          token.position = (ludoPlayer.startPosition + token.stepsFromStart) % BOARD_SIZE;
          captured = this.checkCapture(ludoPlayer, token);
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
      } else if (captured || finished) {
        // Extra turn: capture or finishing a token both grant another turn
        this.extraTurn = false;
        // Player keeps the turn (don't switch) — they must roll again
      } else if (this.extraTurn) {
        // Extra turn from rolling 6: player rolls again
        this.extraTurn = false;
      } else {
        // Normal end of turn
        this.consecutiveSixes = 0;
        this.switchPlayer();
      }

      this.syncBoardMeta();
      return true;
    }

    return false;
  }

  private checkCapture(currentPlayer: LudoPlayer, movedToken: Token): boolean {
    if (SAFE_POSITIONS.includes(movedToken.position)) return false;

    let captured = false;
    for (const otherPlayer of this.ludoPlayers) {
      if (otherPlayer.playerId === currentPlayer.playerId) continue;

      for (const otherToken of otherPlayer.tokens) {
        if (otherToken.status === 'active' && otherToken.position === movedToken.position) {
          otherToken.status = 'home';
          otherToken.position = -1;
          otherToken.stepsFromStart = 0;
          captured = true;
        }
      }
    }
    return captured;
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
    if (player !== this.state.currentPlayer || this.isGameOver()) return moves;

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
