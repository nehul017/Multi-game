import {
  ATLAS_COMPLETE_BONUS,
  ATLAS_ROOMS,
  buildSolvedRoom,
  cellKey,
  connectedKeys,
  isRoomSolved,
  roomById,
  roomScore,
  scrambleRoom,
  selectableTiles,
} from './rooms';
import { puzzleWorldStorage } from './storage';
import type { GridPos, PuzzleTile, PuzzleWorldSnapshot, RoomProgress, PuzzleStatus } from './types';

interface InternalState {
  status: PuzzleStatus;
  progress: Record<string, RoomProgress['status']>;
  currentRoomId: string | null;
  tiles: PuzzleTile[];
  initialTiles: PuzzleTile[];
  undo: PuzzleTile[][];
  selected: GridPos | null;
  score: number;
  roomsSolved: number;
  moves: number;
  roomMoves: number;
  highScore: number;
  isNewHigh: boolean;
  snapTick: number;
  startedAt: number;
  roomStartedAt: number;
}

function cloneTiles(tiles: PuzzleTile[]): PuzzleTile[] {
  return tiles.map((tile) => ({ ...tile }));
}

function openRooms(progress: Record<string, RoomProgress['status']>): Record<string, RoomProgress['status']> {
  const next = { ...progress };
  for (const room of ATLAS_ROOMS) {
    if (next[room.id] === 'cleared') continue;
    const ready = room.requires.every((id) => next[id] === 'cleared');
    next[room.id] = ready ? 'open' : 'locked';
  }
  return next;
}

export class PuzzleWorldEngine {
  private listeners = new Set<() => void>();
  private state: InternalState;

  constructor() {
    this.state = this.fresh('ready');
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): PuzzleWorldSnapshot {
    const room = this.state.currentRoomId ? roomById(this.state.currentRoomId) : null;
    const tiles = this.state.tiles;
    const lit = room ? Array.from(connectedKeys(tiles)) : [];
    return {
      status: this.state.status,
      rooms: ATLAS_ROOMS.map((item) => ({ id: item.id, status: this.state.progress[item.id] })),
      currentRoom: room,
      tiles,
      cols: room?.cols ?? 0,
      rows: room?.rows ?? 0,
      lit,
      selected: this.state.selected,
      score: this.state.score,
      roomsSolved: this.state.roomsSolved,
      moves: this.state.moves,
      roomMoves: this.state.roomMoves,
      highScore: this.state.highScore,
      isNewHigh: this.state.isNewHigh,
      canUndo: this.state.undo.length > 0,
      snapTick: this.state.snapTick,
      elapsedMs: this.state.startedAt ? Date.now() - this.state.startedAt : 0,
    };
  }

  start(): void {
    this.state = this.fresh('atlas');
    this.state.startedAt = Date.now();
    this.emit();
  }

  restart(): void {
    this.start();
  }

  enterRoom(id: string): void {
    if (this.state.status !== 'atlas' && this.state.status !== 'cleared') return;
    const status = this.state.progress[id];
    if (status === 'locked') return;
    const room = roomById(id);
    const solved = buildSolvedRoom(room);
    const tiles = status === 'cleared' ? solved : scrambleRoom(room, solved);
    const pick = selectableTiles(tiles)[0] || null;
    this.state.currentRoomId = id;
    this.state.tiles = tiles;
    this.state.initialTiles = cloneTiles(tiles);
    this.state.undo = [];
    this.state.selected = pick ? { x: pick.x, y: pick.y } : null;
    this.state.roomMoves = 0;
    this.state.roomStartedAt = Date.now();
    this.state.status = 'room';
    this.emit();
  }

  backToAtlas(): void {
    if (this.state.status !== 'room' && this.state.status !== 'cleared') return;
    this.state.currentRoomId = null;
    this.state.tiles = [];
    this.state.initialTiles = [];
    this.state.undo = [];
    this.state.selected = null;
    this.state.status = 'atlas';
    this.emit();
  }

  rotate(x: number, y: number): boolean {
    if (this.state.status !== 'room') return false;
    const tile = this.state.tiles.find((item) => item.x === x && item.y === y);
    if (!tile || tile.locked || tile.role === 'empty') return false;

    this.state.undo.push(cloneTiles(this.state.tiles));
    tile.rot = (tile.rot + 1) % 4;
    this.state.selected = { x, y };
    this.state.roomMoves += 1;
    this.state.moves += 1;

    if (isRoomSolved(this.state.tiles)) {
      this.completeRoom();
    }
    this.emit();
    return true;
  }

  undo(): void {
    if (this.state.status !== 'room') return;
    const prev = this.state.undo.pop();
    if (!prev) return;
    this.state.tiles = prev;
    this.state.roomMoves = Math.max(0, this.state.roomMoves - 1);
    this.state.moves = Math.max(0, this.state.moves - 1);
    this.emit();
  }

  resetRoom(): void {
    if (this.state.status !== 'room') return;
    this.state.tiles = cloneTiles(this.state.initialTiles);
    this.state.undo = [];
    this.state.roomMoves = 0;
    this.state.roomStartedAt = Date.now();
    this.emit();
  }

  moveSelection(dx: number, dy: number): void {
    if (this.state.status !== 'room') return;
    const options = selectableTiles(this.state.tiles);
    if (!options.length) return;
    const current = this.state.selected || { x: options[0].x, y: options[0].y };
    const targetX = current.x + dx;
    const targetY = current.y + dy;
    const exact = options.find((tile) => tile.x === targetX && tile.y === targetY);
    if (exact) {
      this.state.selected = { x: exact.x, y: exact.y };
      this.emit();
      return;
    }
    const fallback = options
      .map((tile) => ({
        tile,
        dist: Math.abs(tile.x - targetX) + Math.abs(tile.y - targetY),
      }))
      .sort((a, b) => a.dist - b.dist)[0];
    if (fallback) {
      this.state.selected = { x: fallback.tile.x, y: fallback.tile.y };
      this.emit();
    }
  }

  finishRun(): void {
    if (this.state.status === 'ready' || this.state.status === 'over') return;
    this.lockScore();
    this.state.status = 'over';
    this.state.currentRoomId = null;
    this.emit();
  }

  private completeRoom(): void {
    const id = this.state.currentRoomId;
    if (!id || this.state.progress[id] === 'cleared') {
      this.state.status = 'cleared';
      this.state.snapTick += 1;
      return;
    }
    const gained = roomScore(this.state.roomMoves, Date.now() - this.state.roomStartedAt);
    this.state.score += gained;
    this.state.roomsSolved += 1;
    this.state.progress[id] = 'cleared';
    this.state.progress = openRooms(this.state.progress);
    this.state.snapTick += 1;
    this.state.status = 'cleared';
    this.lockScore();

    const allClear = ATLAS_ROOMS.every((room) => this.state.progress[room.id] === 'cleared');
    if (allClear) {
      this.state.score += ATLAS_COMPLETE_BONUS;
      this.lockScore();
      this.state.status = 'over';
    }
  }

  private lockScore(): void {
    const high = puzzleWorldStorage.setHighScore(this.state.score);
    this.state.highScore = high;
    this.state.isNewHigh = this.state.score > 0 && this.state.score >= high;
  }

  private fresh(status: PuzzleStatus): InternalState {
    const progress = openRooms(Object.fromEntries(ATLAS_ROOMS.map((room) => [room.id, 'locked'])));
    return {
      status,
      progress,
      currentRoomId: null,
      tiles: [],
      initialTiles: [],
      undo: [],
      selected: null,
      score: 0,
      roomsSolved: 0,
      moves: 0,
      roomMoves: 0,
      highScore: puzzleWorldStorage.getHighScore(),
      isNewHigh: false,
      snapTick: 0,
      startedAt: 0,
      roomStartedAt: 0,
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export { cellKey };
