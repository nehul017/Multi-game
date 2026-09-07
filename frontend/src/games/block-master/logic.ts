import { blockMasterStorage } from './storage';
import type { ActivePiece, BlockMasterSnapshot, CellPos, GameStatus, PieceType } from './types';

export const COLS = 10;
export const ROWS = 20;
export const LINES_PER_LEVEL = 10;
export const CLEAR_ANIM_MS = 220;
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;
export const PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const SHAPES: Record<PieceType, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

const KICKS: Record<PieceType, [number, number][]> = {
  I: [
    [0, 0],
    [-2, 0],
    [2, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [-2, -1],
    [2, -1],
  ],
  O: [[0, 0]],
  T: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
    [-1, -1],
    [1, -1],
  ],
  S: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
  ],
  Z: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
  ],
  J: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
    [-1, -1],
    [1, -1],
  ],
  L: [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
    [-1, -1],
    [1, -1],
  ],
};

export function createBoard(): (PieceType | null)[][] {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
}

export function cloneBoard(board: (PieceType | null)[][]): (PieceType | null)[][] {
  return board.map((row) => row.slice());
}

export function dropIntervalMs(level: number): number {
  const clamped = Math.max(1, level);
  return Math.max(90, Math.round(850 * Math.pow(0.88, clamped - 1)));
}

export function levelFromLines(lines: number): number {
  return 1 + Math.floor(Math.max(0, lines) / LINES_PER_LEVEL);
}

export function lineScore(count: number, level: number): number {
  const base = LINE_SCORES[Math.min(count, 4)] ?? 0;
  return base * Math.max(1, level);
}

export function spawnPiece(type: PieceType): ActivePiece {
  if (type === 'I') return { type, rotation: 0, x: 3, y: -1 };
  if (type === 'O') return { type, rotation: 0, x: 4, y: 0 };
  return { type, rotation: 0, x: 3, y: 0 };
}

export function cellsOf(piece: ActivePiece): CellPos[] {
  const matrix = SHAPES[piece.type][piece.rotation];
  const cells: CellPos[] = [];
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix[r].length; c += 1) {
      if (matrix[r][c]) cells.push({ x: piece.x + c, y: piece.y + r });
    }
  }
  return cells;
}

export function pieceFits(board: (PieceType | null)[][], piece: ActivePiece): boolean {
  for (const { x, y } of cellsOf(piece)) {
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y >= 0 && board[y][x]) return false;
  }
  return true;
}

export function ghostPiece(board: (PieceType | null)[][], piece: ActivePiece): ActivePiece {
  let current = piece;
  while (true) {
    const next = { ...current, y: current.y + 1 };
    if (!pieceFits(board, next)) return current;
    current = next;
  }
}

export function findFullRows(board: (PieceType | null)[][]): number[] {
  const rows: number[] = [];
  for (let y = 0; y < board.length; y += 1) {
    if (board[y].every((cell) => cell !== null)) rows.push(y);
  }
  return rows;
}

export function collapseRows(board: (PieceType | null)[][], rows: number[]): (PieceType | null)[][] {
  if (rows.length === 0) return board;
  const skip = new Set(rows);
  const kept = board.filter((_, index) => !skip.has(index));
  const empty = Array.from({ length: rows.length }, () => Array<PieceType | null>(COLS).fill(null));
  return [...empty, ...kept];
}

export function shuffleBag(random = Math.random): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = bag[i];
    bag[i] = bag[j];
    bag[j] = swap;
  }
  return bag;
}

function tryRotate(board: (PieceType | null)[][], piece: ActivePiece, dir: 1 | -1): ActivePiece | null {
  const rotation = (piece.rotation + dir + 4) % 4;
  const kicks = KICKS[piece.type];
  for (const [dx, dy] of kicks) {
    const candidate: ActivePiece = {
      type: piece.type,
      rotation,
      x: piece.x + dx,
      y: piece.y + dy,
    };
    if (pieceFits(board, candidate)) return candidate;
  }
  return null;
}

type Listener = () => void;

export class BlockMasterEngine {
  private status: GameStatus = 'ready';
  private board = createBoard();
  private active: ActivePiece | null = null;
  private next: PieceType | null = null;
  private hold: PieceType | null = null;
  private canHold = true;
  private score = 0;
  private level = 1;
  private lines = 0;
  private highScore = blockMasterStorage.getHighScore();
  private isNewHigh = false;
  private clearingRows: number[] = [];
  private clearRemain = 0;
  private dropAcc = 0;
  private bag: PieceType[] = [];
  private spawnTick = 0;
  private dropTick = 0;
  private levelTick = 0;
  private clearTick = 0;
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): BlockMasterSnapshot {
    return {
      status: this.status,
      board: cloneBoard(this.board),
      active: this.active ? { ...this.active } : null,
      next: this.next,
      hold: this.hold,
      canHold: this.canHold,
      score: this.score,
      level: this.level,
      lines: this.lines,
      highScore: this.highScore,
      isNewHigh: this.isNewHigh,
      clearingRows: [...this.clearingRows],
      spawnTick: this.spawnTick,
      dropTick: this.dropTick,
      levelTick: this.levelTick,
      clearTick: this.clearTick,
    };
  }

  start() {
    this.resetRun();
    this.status = 'playing';
    this.spawnFromQueue();
    this.emit();
  }

  restart() {
    this.start();
  }

  pause() {
    if (this.status !== 'playing') return;
    this.status = 'paused';
    this.emit();
  }

  resume() {
    if (this.status !== 'paused') return;
    this.status = 'playing';
    this.dropAcc = 0;
    this.emit();
  }

  togglePause() {
    if (this.status === 'playing') this.pause();
    else if (this.status === 'paused') this.resume();
  }

  move(dx: number) {
    if (!this.canControl() || !this.active) return;
    const next = { ...this.active, x: this.active.x + dx };
    if (!pieceFits(this.board, next)) return;
    this.active = next;
    this.emit();
  }

  rotate(dir: 1 | -1 = 1) {
    if (!this.canControl() || !this.active) return;
    const next = tryRotate(this.board, this.active, dir);
    if (!next) return;
    this.active = next;
    this.emit();
  }

  softDrop() {
    if (!this.canControl() || !this.active) return;
    const next = { ...this.active, y: this.active.y + 1 };
    if (pieceFits(this.board, next)) {
      this.active = next;
      this.dropAcc = 0;
      this.emit();
      return;
    }
    this.lockActive();
  }

  hardDrop() {
    if (!this.canControl() || !this.active) return;
    this.active = ghostPiece(this.board, this.active);
    this.dropTick += 1;
    this.lockActive();
  }

  holdPiece() {
    if (!this.canControl() || !this.active || !this.canHold) return;
    const current = this.active.type;
    this.canHold = false;
    if (this.hold) {
      this.active = spawnPiece(this.hold);
    } else {
      this.active = spawnPiece(this.takeNext());
    }
    this.hold = current;
    if (!pieceFits(this.board, this.active)) {
      this.finishGame();
      return;
    }
    this.spawnTick += 1;
    this.dropAcc = 0;
    this.emit();
  }

  advance(dt: number) {
    if (this.status !== 'playing') return;

    if (this.clearingRows.length > 0) {
      this.clearRemain -= dt;
      if (this.clearRemain <= 0) this.finishClear();
      return;
    }

    this.dropAcc += dt;
    const interval = dropIntervalMs(this.level);
    while (this.status === 'playing' && this.clearingRows.length === 0 && this.dropAcc >= interval) {
      this.dropAcc -= interval;
      this.stepGravity();
    }
  }

  private canControl() {
    return this.status === 'playing' && this.clearingRows.length === 0;
  }

  private resetRun() {
    this.board = createBoard();
    this.active = null;
    this.hold = null;
    this.canHold = true;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.isNewHigh = false;
    this.clearingRows = [];
    this.clearRemain = 0;
    this.dropAcc = 0;
    this.bag = [];
    this.next = this.takeFromBag();
    this.highScore = blockMasterStorage.getHighScore();
  }

  private takeFromBag(): PieceType {
    if (this.bag.length === 0) this.bag = shuffleBag();
    return this.bag.shift() as PieceType;
  }

  private takeNext(): PieceType {
    const current = this.next ?? this.takeFromBag();
    this.next = this.takeFromBag();
    return current;
  }

  private spawnFromQueue() {
    this.active = spawnPiece(this.takeNext());
    this.canHold = true;
    this.dropAcc = 0;
    this.spawnTick += 1;
    if (!this.active || !pieceFits(this.board, this.active)) {
      this.finishGame();
    }
  }

  private stepGravity() {
    if (!this.active) return;
    const next = { ...this.active, y: this.active.y + 1 };
    if (pieceFits(this.board, next)) {
      this.active = next;
      this.emit();
      return;
    }
    this.lockActive();
  }

  private lockActive() {
    if (!this.active) return;
    const cells = cellsOf(this.active);
    if (cells.some((cell) => cell.y < 0)) {
      this.finishGame();
      return;
    }

    const nextBoard = cloneBoard(this.board);
    for (const { x, y } of cells) {
      nextBoard[y][x] = this.active.type;
    }
    this.board = nextBoard;
    this.active = null;

    const full = findFullRows(this.board);
    if (full.length > 0) {
      this.clearingRows = full;
      this.clearRemain = CLEAR_ANIM_MS;
      this.clearTick += 1;
      this.emit();
      return;
    }

    this.spawnFromQueue();
    this.emit();
  }

  private finishClear() {
    const count = this.clearingRows.length;
    this.board = collapseRows(this.board, this.clearingRows);
    this.clearingRows = [];
    this.clearRemain = 0;
    this.lines += count;
    this.addScore(lineScore(count, this.level));
    const nextLevel = levelFromLines(this.lines);
    if (nextLevel > this.level) {
      this.level = nextLevel;
      this.levelTick += 1;
    }
    this.spawnFromQueue();
    this.emit();
  }

  private addScore(amount: number) {
    if (amount <= 0) return;
    this.score += amount;
    if (this.score > this.highScore) {
      this.highScore = blockMasterStorage.setHighScore(this.score);
      this.isNewHigh = true;
    }
  }

  private finishGame() {
    this.status = 'over';
    this.active = null;
    this.clearingRows = [];
    this.clearRemain = 0;
    if (this.score > 0) {
      this.highScore = blockMasterStorage.setHighScore(this.score);
    }
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
