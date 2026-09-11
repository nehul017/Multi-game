import { GameEngine } from '../engine';
import { CARROM_BASELINE, CARROM_BOARD, CARROM_DEFAULT_POINTS, CARROM_MIN_POWER } from './constants';
import { clampToBaseline, createOpeningPieces, defaultStrikerPosition } from './layout';
import { simulateShot } from './physics';
import { opponentColor, remainingOf, resolveAfterShot, syncPocketCounts } from './rules';
import type { CarromBoardState, CarromColor, CarromSettings, CarromShotInput } from './types';

const asBoard = (board: unknown): CarromBoardState => board as CarromBoardState;

const parseShot = (move: Record<string, unknown>): CarromShotInput | null => {
  const action = typeof move.action === 'string' ? move.action : 'shoot';
  if (action !== 'shoot') return null;
  const shotId = typeof move.shotId === 'string' ? move.shotId : '';
  const strikerX = Number(move.strikerX);
  const strikerY = Number(move.strikerY);
  const angle = Number(move.angle);
  const power = Number(move.power);
  if (!shotId || !Number.isFinite(strikerX) || !Number.isFinite(strikerY)) return null;
  if (!Number.isFinite(angle) || !Number.isFinite(power)) return null;
  return { shotId, strikerX, strikerY, angle, power };
};

export class Carrom extends GameEngine {
  constructor(players: string[], settings: CarromSettings = {}) {
    super(players);
    this.state.metadata.pointsToWin = settings.pointsToWin || CARROM_DEFAULT_POINTS;
    this.initGame();
  }

  private board(): CarromBoardState {
    return asBoard(this.state.board);
  }

  private colorOf(player: string): CarromColor {
    return this.board().colors[player] || (player === this.state.players[1] ? 'black' : 'white');
  }

  initGame(): void {
    const [white, black] = this.state.players;
    const pointsToWin = Number(this.state.metadata.pointsToWin) || CARROM_DEFAULT_POINTS;
    const board: CarromBoardState = {
      pieces: createOpeningPieces(),
      scores: Object.fromEntries(this.state.players.map((id) => [id, 0])),
      pocketedCounts: { white: 0, black: 0, queen: false },
      colors: {
        [white]: 'white',
        ...(black ? { [black]: 'black' } : {}),
      },
      queenStatus: 'on-board',
      queenPendingFor: null,
      queenCoveredBy: null,
      phase: 'aiming',
      pointsToWin,
      foul: null,
      foulMessage: null,
      lastShot: null,
      boardNumber: 1,
      statusMessage: 'Break to start',
    };
    this.state.board = board;
    this.state.status = 'playing';
    this.state.currentPlayer = white;
    this.state.winner = null;
    this.state.metadata = {
      ...this.state.metadata,
      colors: board.colors,
      scores: board.scores,
      pointsToWin,
      queenStatus: board.queenStatus,
      phase: board.phase,
    };
  }

  private resetBoardKeepScores(nextBreaker: string): void {
    const prev = this.board();
    const next: CarromBoardState = {
      ...prev,
      pieces: createOpeningPieces(),
      pocketedCounts: { white: 0, black: 0, queen: false },
      queenStatus: 'on-board',
      queenPendingFor: null,
      queenCoveredBy: null,
      phase: 'aiming',
      foul: null,
      foulMessage: null,
      lastShot: null,
      boardNumber: prev.boardNumber + 1,
      statusMessage: 'Next board',
    };
    const color = next.colors[nextBreaker] || 'white';
    const pos = defaultStrikerPosition(color);
    const striker = next.pieces.find((piece) => piece.kind === 'striker');
    if (striker) {
      striker.x = pos.x;
      striker.y = pos.y;
    }
    this.state.board = next;
    this.state.currentPlayer = nextBreaker;
    this.syncMeta();
  }

  private syncMeta(): void {
    const board = this.board();
    this.state.metadata = {
      ...this.state.metadata,
      colors: board.colors,
      scores: board.scores,
      pointsToWin: board.pointsToWin,
      queenStatus: board.queenStatus,
      queenPendingFor: board.queenPendingFor,
      queenCoveredBy: board.queenCoveredBy,
      phase: board.phase,
      foul: board.foul,
      foulMessage: board.foulMessage,
      statusMessage: board.statusMessage,
      pocketedCounts: board.pocketedCounts,
      boardNumber: board.boardNumber,
    };
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    if (player !== this.state.currentPlayer) return false;
    const board = this.board();
    if (board.phase !== 'aiming') return false;
    const shot = parseShot(move);
    if (!shot) return false;
    if (shot.power < CARROM_MIN_POWER || shot.power > 1) return false;
    const color = this.colorOf(player);
    const placed = clampToBaseline(color, shot.strikerX, shot.strikerY);
    const along = color === 'white' ? placed.x : placed.x;
    if (along < 156 || along > 844) return false;
    const expectedY = color === 'white' ? CARROM_BOARD - CARROM_BASELINE : CARROM_BASELINE;
    if (Math.abs(placed.y - expectedY) > 12) return false;
    return true;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;
    const shot = parseShot(move);
    if (!shot) return false;

    const color = this.colorOf(player);
    const placed = clampToBaseline(color, shot.strikerX, shot.strikerY);
    const input: CarromShotInput = { ...shot, strikerX: placed.x, strikerY: placed.y };
    const simulated = simulateShot(this.board().pieces, input);
    const resolved = resolveAfterShot(this.board(), player, { ...simulated, input });

    this.state.board = resolved.board;
    this.addMoveToHistory(player, 'shoot', {
      shotId: input.shotId,
      strikerX: input.strikerX,
      strikerY: input.strikerY,
      angle: input.angle,
      power: input.power,
      foul: resolved.result.foul,
      turnKept: resolved.result.turnKept,
      pocketedIds: resolved.result.pocketedIds,
      boardWonBy: resolved.result.boardWonBy,
    });

    if (resolved.matchWinner) {
      this.endGame(resolved.matchWinner);
      resolved.board.phase = 'match-complete';
    } else if (resolved.result.boardWonBy && resolved.board.phase === 'board-complete') {
      this.resetBoardKeepScores(resolved.result.boardWonBy);
    } else if (!resolved.result.turnKept) {
      this.switchPlayer();
    }

    this.syncMeta();
    return true;
  }

  checkWin(): string | null {
    return this.state.winner;
  }

  checkDraw(): boolean {
    return this.state.status === 'draw';
  }

  getValidMoves(player: string): Record<string, unknown>[] {
    if (this.isGameOver() || player !== this.state.currentPlayer) return [];
    const board = this.board();
    const color = this.colorOf(player);
    const own = board.pieces.filter((piece) => piece.kind === color && !piece.pocketed);
    const pockets = [
      { x: 10, y: 10 },
      { x: 990, y: 10 },
      { x: 990, y: 990 },
      { x: 10, y: 990 },
    ];
    const striker = board.pieces.find((piece) => piece.kind === 'striker');
    if (!striker || own.length === 0) {
      const pos = defaultStrikerPosition(color);
      return [
        {
          action: 'shoot',
          shotId: `bot-${Date.now()}`,
          strikerX: pos.x,
          strikerY: pos.y,
          angle: color === 'white' ? -Math.PI / 2 : Math.PI / 2,
          power: 0.62,
        },
      ];
    }

    let best: Record<string, unknown> | null = null;
    let bestScore = -Infinity;
    for (const coin of own) {
      for (const pocket of pockets) {
        const toPocketX = pocket.x - coin.x;
        const toPocketY = pocket.y - coin.y;
        const distPocket = Math.hypot(toPocketX, toPocketY) || 1;
        const aimX = coin.x - (toPocketX / distPocket) * 48;
        const aimY = coin.y - (toPocketY / distPocket) * 48;
        const placed = clampToBaseline(color, striker.x, striker.y);
        const angle = Math.atan2(aimY - placed.y, aimX - placed.x);
        const alignment = (toPocketX * (coin.x - placed.x) + toPocketY * (coin.y - placed.y)) / (distPocket * (Math.hypot(coin.x - placed.x, coin.y - placed.y) || 1));
        const score = alignment * 10 - distPocket / 200;
        if (score > bestScore) {
          bestScore = score;
          best = {
            action: 'shoot',
            shotId: `bot-${player}-${Date.now()}`,
            strikerX: placed.x,
            strikerY: placed.y,
            angle,
            power: Math.min(0.92, 0.48 + distPocket / 1400),
          };
        }
      }
    }
    return best ? [best] : [];
  }

  eliminatePlayer(playerId: string): void {
    const other = this.state.players.find((id) => id !== playerId) || null;
    if (other) this.endGame(other);
    else this.endGame(null);
  }
}

export const isCarromEngine = (engine: GameEngine): engine is Carrom => engine instanceof Carrom;

export const remainingCoins = remainingOf;
export { opponentColor };
