import { GameEngine } from './engine';

type PieceColor = 'white' | 'black';
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

type Square = ChessPiece | null;
type ChessBoard = Square[][];

interface Position {
  row: number;
  col: number;
}

export class Chess extends GameEngine {
  private colors: Map<string, PieceColor>;
  private enPassantTarget: Position | null = null;

  constructor(players: string[]) {
    super(players);
    this.colors = new Map([
      [players[0], 'white'],
      [players[1], 'black'],
    ]);
    this.initGame();
  }

  initGame(): void {
    const board: ChessBoard = Array.from({ length: 8 }, () => Array(8).fill(null));

    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    for (let col = 0; col < 8; col++) {
      board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
      board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
      board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
      board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
    }

    this.state.board = board;
    this.state.status = 'playing';
    this.state.currentPlayer = this.state.players[0];
    this.state.metadata = {
      colors: Object.fromEntries(this.colors),
      inCheck: false,
      castlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
    };
  }

  validateMove(player: string, move: Record<string, unknown>): boolean {
    if (this.isGameOver()) return false;
    if (player !== this.state.currentPlayer) return false;

    const from = move.from as Position;
    const to = move.to as Position;
    const board = this.state.board as ChessBoard;
    const color = this.colors.get(player)!;

    if (!this.isInBounds(from) || !this.isInBounds(to)) return false;

    const piece = board[from.row][from.col];
    if (!piece || piece.color !== color) return false;

    const target = board[to.row][to.col];
    if (target && target.color === color) return false;

    if (!this.isPieceMoveLegal(piece, from, to, board)) return false;

    const testBoard = this.cloneBoard(board);
    testBoard[to.row][to.col] = testBoard[from.row][from.col];
    testBoard[from.row][from.col] = null;
    if (this.isKingInCheck(color, testBoard)) return false;

    return true;
  }

  makeMove(player: string, move: Record<string, unknown>): boolean {
    if (!this.validateMove(player, move)) return false;

    const from = move.from as Position;
    const to = move.to as Position;
    const board = this.state.board as ChessBoard;
    const piece = board[from.row][from.col]!;
    const color = this.colors.get(player)!;

    // En passant capture
    if (piece.type === 'pawn' && this.enPassantTarget &&
        to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) {
      const capturedRow = color === 'white' ? to.row + 1 : to.row - 1;
      board[capturedRow][to.col] = null;
    }

    // Track en passant
    this.enPassantTarget = null;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      this.enPassantTarget = {
        row: (from.row + to.row) / 2,
        col: from.col,
      };
    }

    // Castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      if (to.col > from.col) {
        board[from.row][5] = board[from.row][7];
        board[from.row][7] = null;
        if (board[from.row][5]) board[from.row][5]!.hasMoved = true;
      } else {
        board[from.row][3] = board[from.row][0];
        board[from.row][0] = null;
        if (board[from.row][3]) board[from.row][3]!.hasMoved = true;
      }
    }

    board[to.row][to.col] = piece;
    board[from.row][from.col] = null;
    piece.hasMoved = true;

    // Pawn promotion
    const promotionRow = color === 'white' ? 0 : 7;
    if (piece.type === 'pawn' && to.row === promotionRow) {
      const promoteType = (move.promotion as PieceType) || 'queen';
      piece.type = promoteType;
    }

    const notation = this.toAlgebraic(from, to, piece);
    this.addMoveToHistory(player, notation, { from, to, piece: piece.type });

    this.switchPlayer();
    const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';

    const inCheck = this.isKingInCheck(opponentColor, board);
    this.state.metadata.inCheck = inCheck;

    const winner = this.checkWin();
    if (winner) {
      this.endGame(winner);
    } else if (this.checkDraw()) {
      this.endGame(null);
    }

    return true;
  }

  checkWin(): string | null {
    const board = this.state.board as ChessBoard;
    const currentColor = this.colors.get(this.state.currentPlayer)!;

    if (this.isKingInCheck(currentColor, board) && !this.hasAnyLegalMove(currentColor, board)) {
      const winner = this.state.players.find((p) => this.colors.get(p) !== currentColor);
      return winner || null;
    }

    return null;
  }

  checkDraw(): boolean {
    const board = this.state.board as ChessBoard;
    const currentColor = this.colors.get(this.state.currentPlayer)!;

    if (!this.isKingInCheck(currentColor, board) && !this.hasAnyLegalMove(currentColor, board)) {
      return true;
    }

    const pieces: ChessPiece[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c]) pieces.push(board[r][c]!);
      }
    }

    if (pieces.length === 2) return true;
    if (pieces.length === 3) {
      const nonKing = pieces.find((p) => p.type !== 'king');
      if (nonKing && (nonKing.type === 'bishop' || nonKing.type === 'knight')) return true;
    }

    return false;
  }

  getValidMoves(player: string): Record<string, unknown>[] {
    const board = this.state.board as ChessBoard;
    const color = this.colors.get(player);
    if (!color) return [];

    const moves: Record<string, unknown>[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== color) continue;

        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            const from = { row: r, col: c };
            const to = { row: tr, col: tc };
            if (this.validateMove(player, { from, to })) {
              moves.push({ from, to, piece: piece.type });
            }
          }
        }
      }
    }

    return moves;
  }

  private isPieceMoveLegal(piece: ChessPiece, from: Position, to: Position, board: ChessBoard): boolean {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(piece, from, to, board);
      case 'rook':
        return (dr === 0 || dc === 0) && !this.isPathBlocked(from, to, board);
      case 'bishop':
        return absDr === absDc && absDr > 0 && !this.isPathBlocked(from, to, board);
      case 'queen':
        return ((dr === 0 || dc === 0) || (absDr === absDc && absDr > 0)) && !this.isPathBlocked(from, to, board);
      case 'knight':
        return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
      case 'king':
        return this.isValidKingMove(piece, from, to, board);
      default:
        return false;
    }
  }

  private isValidPawnMove(piece: ChessPiece, from: Position, to: Position, board: ChessBoard): boolean {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    if (dc === 0 && dr === direction && !board[to.row][to.col]) return true;

    if (dc === 0 && dr === 2 * direction && from.row === startRow &&
        !board[from.row + direction][from.col] && !board[to.row][to.col]) return true;

    if (Math.abs(dc) === 1 && dr === direction) {
      if (board[to.row][to.col]) return true;
      if (this.enPassantTarget && to.row === this.enPassantTarget.row && to.col === this.enPassantTarget.col) return true;
    }

    return false;
  }

  private isValidKingMove(piece: ChessPiece, from: Position, to: Position, board: ChessBoard): boolean {
    const absDr = Math.abs(to.row - from.row);
    const absDc = Math.abs(to.col - from.col);

    if (absDr <= 1 && absDc <= 1) return true;

    if (!piece.hasMoved && absDr === 0 && absDc === 2) {
      if (this.isKingInCheck(piece.color, board)) return false;

      if (to.col > from.col) {
        const rook = board[from.row][7];
        if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
        if (board[from.row][5] || board[from.row][6]) return false;

        const testBoard1 = this.cloneBoard(board);
        testBoard1[from.row][5] = testBoard1[from.row][4];
        testBoard1[from.row][4] = null;
        if (this.isKingInCheck(piece.color, testBoard1)) return false;
      } else {
        const rook = board[from.row][0];
        if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
        if (board[from.row][1] || board[from.row][2] || board[from.row][3]) return false;

        const testBoard1 = this.cloneBoard(board);
        testBoard1[from.row][3] = testBoard1[from.row][4];
        testBoard1[from.row][4] = null;
        if (this.isKingInCheck(piece.color, testBoard1)) return false;
      }

      return true;
    }

    return false;
  }

  private isPathBlocked(from: Position, to: Position, board: ChessBoard): boolean {
    const dr = Math.sign(to.row - from.row);
    const dc = Math.sign(to.col - from.col);
    let r = from.row + dr;
    let c = from.col + dc;

    while (r !== to.row || c !== to.col) {
      if (board[r][c]) return true;
      r += dr;
      c += dc;
    }

    return false;
  }

  private isKingInCheck(color: PieceColor, board: ChessBoard): boolean {
    let kingPos: Position | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece?.type === 'king' && piece.color === color) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return false;

    const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === opponentColor) {
          if (piece.type === 'king') {
            if (Math.abs(r - kingPos.row) <= 1 && Math.abs(c - kingPos.col) <= 1) return true;
          } else if (this.isPieceMoveLegal(piece, { row: r, col: c }, kingPos, board)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private hasAnyLegalMove(color: PieceColor, board: ChessBoard): boolean {
    const player = this.state.players.find((p) => this.colors.get(p) === color);
    if (!player) return false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== color) continue;

        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {
            const from = { row: r, col: c };
            const to = { row: tr, col: tc };
            if (r === tr && c === tc) continue;

            const target = board[tr][tc];
            if (target && target.color === color) continue;

            if (this.isPieceMoveLegal(piece, from, to, board)) {
              const testBoard = this.cloneBoard(board);
              testBoard[tr][tc] = testBoard[r][c];
              testBoard[r][c] = null;
              if (!this.isKingInCheck(color, testBoard)) return true;
            }
          }
        }
      }
    }

    return false;
  }

  private isInBounds(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  private cloneBoard(board: ChessBoard): ChessBoard {
    return board.map((row) =>
      row.map((cell) => (cell ? { ...cell } : null))
    );
  }

  private toAlgebraic(from: Position, to: Position, piece: ChessPiece): string {
    const files = 'abcdefgh';
    const fromStr = `${files[from.col]}${8 - from.row}`;
    const toStr = `${files[to.col]}${8 - to.row}`;
    const pieceChar = piece.type === 'pawn' ? '' : piece.type[0].toUpperCase();
    return `${pieceChar}${fromStr}-${toStr}`;
  }
}
