import { Chess, type Move, type Square } from 'chess.js';
import type { ChessColor, ChessMoveInput, ChessPieceType, ChessPos, ChessSanMove } from '../types';
import { chessJsToGrid, posToSquare, squareToPos } from './convert';

const PROMO: Record<ChessPieceType, 'q' | 'r' | 'b' | 'n' | undefined> = {
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
  king: undefined,
  pawn: undefined,
};

export class ChessRules {
  readonly game: Chess;

  constructor(fen?: string) {
    this.game = fen ? new Chess(fen) : new Chess();
  }

  static fromPgn(pgn: string) {
    const rules = new ChessRules();
    if (pgn.trim()) rules.game.loadPgn(pgn);
    return rules;
  }

  clone() {
    return new ChessRules(this.game.fen());
  }

  turn(): ChessColor {
    return this.game.turn() === 'w' ? 'white' : 'black';
  }

  board() {
    return chessJsToGrid(this.game);
  }

  fen() {
    return this.game.fen();
  }

  pgn() {
    return this.game.pgn();
  }

  legalTargets(from: ChessPos): ChessPos[] {
    const square = posToSquare(from);
    return this.game
      .moves({ square, verbose: true })
      .map((move) => squareToPos(move.to));
  }

  isLegal(move: ChessMoveInput) {
    const preview = this.clone();
    return Boolean(preview.tryMove(move));
  }

  tryMove(move: ChessMoveInput): ChessSanMove | null {
    try {
      const result = this.game.move({
        from: posToSquare(move.from),
        to: posToSquare(move.to),
        promotion: move.promotion ? PROMO[move.promotion] : 'q',
      });
      if (!result) return null;
      return this.toSan(result);
    } catch {
      return null;
    }
  }

  needsPromotion(from: ChessPos, to: ChessPos) {
    const piece = this.game.get(posToSquare(from));
    if (!piece || piece.type !== 'p') return false;
    return to.row === 0 || to.row === 7;
  }

  inCheck() {
    return this.game.isCheck();
  }

  isCheckmate() {
    return this.game.isCheckmate();
  }

  isStalemate() {
    return this.game.isStalemate();
  }

  isDraw() {
    return this.game.isDraw() || this.game.isStalemate() || this.game.isThreefoldRepetition() || this.game.isInsufficientMaterial();
  }

  isGameOver() {
    return this.game.isGameOver();
  }

  history(): ChessSanMove[] {
    return this.game.history({ verbose: true }).map((move) => this.toSan(move));
  }

  undo() {
    return this.game.undo();
  }

  loadFen(fen: string) {
    this.game.load(fen);
  }

  kingSquare(color: ChessColor): ChessPos | null {
    const board = this.game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (cell?.type === 'k' && cell.color === (color === 'white' ? 'w' : 'b')) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  private toSan(move: Move): ChessSanMove {
    return {
      san: move.san,
      from: move.from,
      to: move.to,
      color: move.color === 'w' ? 'white' : 'black',
      captured: Boolean(move.captured),
      check: move.san.includes('+') && !move.san.includes('#'),
      checkmate: move.san.includes('#'),
      castle: move.flags.includes('k') || move.flags.includes('q'),
    };
  }
}

export function squareName(pos: ChessPos) {
  return posToSquare(pos) as Square;
}
