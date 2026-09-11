import { puzzleById } from './catalog';
import { buildEdges, hashSeed, mulberry32, puzzleScore, scatterPiece } from './pieces';
import { jigsawStorage } from './storage';
import { DIFFICULTIES, SNAP_CELLS, TRAY_Y, type JigsawDifficulty, type JigsawPiece, type JigsawSnapshot, type JigsawStatus } from './types';

type Listener = () => void;

const difficultyById = (id: JigsawDifficulty['id']): JigsawDifficulty =>
  DIFFICULTIES.find((item) => item.id === id) ?? DIFFICULTIES[0];

export class JigsawWorldEngine {
  private status: JigsawStatus = 'hub';
  private puzzleId: string | null = null;
  private difficulty: JigsawDifficulty = DIFFICULTIES[0];
  private pieces: JigsawPiece[] = [];
  private moves = 0;
  private score = 0;
  private highScore = jigsawStorage.getHighScore();
  private isNewHigh = false;
  private showPreview = false;
  private hintSlot: { col: number; row: number } | null = null;
  private snapTick = 0;
  private startedAt = 0;
  private elapsedMs = 0;
  private zCursor = 1;
  private hintTimer = 0;
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  getSnapshot(): JigsawSnapshot {
    const puzzle = this.puzzleId ? puzzleById(this.puzzleId) : null;
    const placed = this.pieces.filter((piece) => piece.placed).length;
    return {
      status: this.status,
      puzzle,
      difficulty: this.difficulty,
      pieces: this.pieces.map((piece) => ({ ...piece, edges: { ...piece.edges } })),
      cols: this.difficulty.cols,
      rows: this.difficulty.rows,
      placed,
      total: this.pieces.length,
      moves: this.moves,
      score: this.score,
      highScore: this.highScore,
      isNewHigh: this.isNewHigh,
      showPreview: this.showPreview,
      hintSlot: this.hintSlot,
      elapsedMs: this.elapsedMs,
      snapTick: this.snapTick,
    };
  }

  start(puzzleId: string, difficultyId: JigsawDifficulty['id']) {
    const puzzle = puzzleById(puzzleId);
    const difficulty = difficultyById(difficultyId);
    const seed = hashSeed(`${puzzle.id}:${difficulty.id}`);
    const rng = mulberry32(seed + 17);
    const edges = buildEdges(difficulty.cols, difficulty.rows, seed);
    const total = difficulty.cols * difficulty.rows;

    this.puzzleId = puzzle.id;
    this.difficulty = difficulty;
    this.status = 'playing';
    this.moves = 0;
    this.score = 0;
    this.isNewHigh = false;
    this.showPreview = false;
    this.hintSlot = null;
    this.startedAt = Date.now();
    this.elapsedMs = 0;
    this.zCursor = 1;
    this.pieces = [];

    for (let row = 0; row < difficulty.rows; row += 1) {
      for (let col = 0; col < difficulty.cols; col += 1) {
        const scatter = scatterPiece(this.pieces.length, total, rng);
        this.pieces.push({
          id: `p-${col}-${row}`,
          col,
          row,
          x: scatter.x,
          y: scatter.y,
          placed: false,
          z: this.pieces.length + 1,
          edges: edges[row][col],
        });
      }
    }

    this.emit();
  }

  movePiece(id: string, x: number, y: number) {
    if (this.status !== 'playing') return;
    const piece = this.pieces.find((item) => item.id === id);
    if (!piece || piece.placed) return;
    piece.x = Math.min(1.15, Math.max(-0.2, x));
    piece.y = Math.min(1.35, Math.max(-0.2, y));
    this.emit();
  }

  liftPiece(id: string) {
    if (this.status !== 'playing') return;
    const piece = this.pieces.find((item) => item.id === id);
    if (!piece || piece.placed) return;
    this.zCursor += 1;
    piece.z = this.zCursor;
    this.emit();
  }

  dropPiece(id: string): 'snap' | 'drop' | null {
    if (this.status !== 'playing') return null;
    const piece = this.pieces.find((item) => item.id === id);
    if (!piece || piece.placed) return null;

    this.moves += 1;
    const targetX = piece.col / this.difficulty.cols;
    const targetY = piece.row / this.difficulty.rows;
    const dx = (piece.x - targetX) * this.difficulty.cols;
    const dy = (piece.y - targetY) * this.difficulty.rows;
    const close = Math.hypot(dx, dy) <= SNAP_CELLS;

    if (close) {
      piece.x = targetX;
      piece.y = targetY;
      piece.placed = true;
      piece.z = 0;
      this.snapTick += 1;
      if (this.hintSlot && this.hintSlot.col === piece.col && this.hintSlot.row === piece.row) {
        this.hintSlot = null;
      }
      if (this.pieces.every((item) => item.placed)) {
        this.finishPuzzle();
      }
      this.emit();
      return 'snap';
    }

    const onBoard = piece.x >= -0.08 && piece.x <= 1 && piece.y >= -0.08 && piece.y < 1;
    if (onBoard) {
      piece.x = Math.min(1 - 1 / this.difficulty.cols, Math.max(0, piece.x));
      piece.y = Math.min(1 - 1 / this.difficulty.rows, Math.max(0, piece.y));
    } else {
      piece.y = TRAY_Y;
    }

    this.emit();
    return 'drop';
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
    this.emit();
  }

  hint() {
    if (this.status !== 'playing') return;
    const open = this.pieces.filter((piece) => !piece.placed);
    if (!open.length) return;
    const pick = open[Math.floor(Math.random() * open.length)];
    this.hintSlot = { col: pick.col, row: pick.row };
    this.zCursor += 1;
    pick.z = this.zCursor;
    if (this.hintTimer) window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => {
      this.hintSlot = null;
      this.emit();
    }, 1600);
    this.emit();
  }

  shuffleLoose() {
    if (this.status !== 'playing') return;
    const rng = mulberry32(Date.now() >>> 0);
    const loose = this.pieces.filter((piece) => !piece.placed);
    loose.forEach((piece, index) => {
      const next = scatterPiece(index, loose.length, rng);
      piece.x = next.x;
      piece.y = next.y;
      this.zCursor += 1;
      piece.z = this.zCursor;
    });
    this.emit();
  }

  tick(now = Date.now()) {
    if (this.status !== 'playing' || !this.startedAt) return;
    this.elapsedMs = now - this.startedAt;
  }

  backToHub() {
    if (this.hintTimer) window.clearTimeout(this.hintTimer);
    this.status = 'hub';
    this.puzzleId = null;
    this.pieces = [];
    this.hintSlot = null;
    this.showPreview = false;
    this.elapsedMs = 0;
    this.emit();
  }

  playAgain() {
    if (!this.puzzleId) {
      this.backToHub();
      return;
    }
    this.start(this.puzzleId, this.difficulty.id);
  }

  private finishPuzzle() {
    this.elapsedMs = this.startedAt ? Date.now() - this.startedAt : this.elapsedMs;
    this.score = puzzleScore(this.difficulty.level, this.pieces.length, this.elapsedMs);
    this.highScore = jigsawStorage.setHighScore(this.score);
    this.isNewHigh = this.score >= this.highScore && this.score > 0;
    if (this.puzzleId) {
      jigsawStorage.markCompleted({
        puzzleId: this.puzzleId,
        difficulty: this.difficulty.id,
        score: this.score,
        durationMs: this.elapsedMs,
        at: Date.now(),
      });
    }
    this.status = 'complete';
  }
}
