export type TileShape = 'I' | 'L' | 'T' | 'X' | 'C';
export type TileRole = 'path' | 'start' | 'goal' | 'empty' | 'decoy';
export type RoomStatus = 'locked' | 'open' | 'cleared';
export type PuzzleStatus = 'ready' | 'atlas' | 'room' | 'cleared' | 'over';
export type RoomMood = 'dawn' | 'garden' | 'harbor' | 'keep' | 'market' | 'frost' | 'ember' | 'sky';
export type RoomRelic = 'crystal' | 'lantern' | 'coin' | 'leaf' | 'bell';

export interface GridPos {
  x: number;
  y: number;
}

export interface PuzzleTile {
  x: number;
  y: number;
  shape: TileShape;
  rot: number;
  role: TileRole;
  gem: boolean;
  locked: boolean;
}

export interface RoomDef {
  id: string;
  name: string;
  hint: string;
  cols: number;
  rows: number;
  seed: number;
  gems: number;
  decoys: number;
  requires: string[];
  atlas: { x: number; y: number };
  mood: RoomMood;
  relic: RoomRelic;
}

export interface RoomProgress {
  id: string;
  status: RoomStatus;
}

export interface PuzzleWorldSnapshot {
  status: PuzzleStatus;
  atlas: RoomDef[];
  rooms: RoomProgress[];
  currentRoom: RoomDef | null;
  tiles: PuzzleTile[];
  cols: number;
  rows: number;
  lit: string[];
  selected: GridPos | null;
  score: number;
  roomsSolved: number;
  moves: number;
  roomMoves: number;
  highScore: number;
  isNewHigh: boolean;
  canUndo: boolean;
  snapTick: number;
  elapsedMs: number;
}

export const ROOM_COUNT = 12;
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const SHAPE_MASK: Record<TileShape, number> = {
  I: N | S,
  L: N | E,
  T: N | E | S,
  X: N | E | S | W,
  C: N,
};

export const DIRS = [
  { bit: N, dx: 0, dy: -1, opposite: S },
  { bit: E, dx: 1, dy: 0, opposite: W },
  { bit: S, dx: 0, dy: 1, opposite: N },
  { bit: W, dx: -1, dy: 0, opposite: E },
] as const;
