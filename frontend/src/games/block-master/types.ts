export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

export interface CellPos {
  x: number;
  y: number;
}

export interface BlockMasterSnapshot {
  status: GameStatus;
  board: (PieceType | null)[][];
  active: ActivePiece | null;
  next: PieceType | null;
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  highScore: number;
  isNewHigh: boolean;
  clearingRows: number[];
  spawnTick: number;
  dropTick: number;
  levelTick: number;
  clearTick: number;
}
