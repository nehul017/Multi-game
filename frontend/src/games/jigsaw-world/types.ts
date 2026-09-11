export type JigsawStatus = 'hub' | 'playing' | 'complete';
export type JigsawDifficultyId = 'easy' | 'medium' | 'hard' | 'expert';
export type JigsawCategory = 'nature' | 'landscapes' | 'art' | 'travel' | 'portraits';
export type EdgeKind = -1 | 0 | 1;

export interface JigsawDifficulty {
  id: JigsawDifficultyId;
  label: string;
  blurb: string;
  cols: number;
  rows: number;
  level: number;
}

export interface JigsawPuzzleDef {
  id: string;
  title: string;
  blurb: string;
  category: JigsawCategory;
  src: string;
}

export interface JigsawPiece {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  placed: boolean;
  z: number;
  edges: {
    top: EdgeKind;
    right: EdgeKind;
    bottom: EdgeKind;
    left: EdgeKind;
  };
}

export interface JigsawSnapshot {
  status: JigsawStatus;
  puzzle: JigsawPuzzleDef | null;
  difficulty: JigsawDifficulty;
  pieces: JigsawPiece[];
  cols: number;
  rows: number;
  placed: number;
  total: number;
  moves: number;
  score: number;
  highScore: number;
  isNewHigh: boolean;
  showPreview: boolean;
  hintSlot: { col: number; row: number } | null;
  elapsedMs: number;
  snapTick: number;
}

export const DIFFICULTIES: JigsawDifficulty[] = [
  { id: 'easy', label: 'Easy', blurb: '12 pieces', cols: 4, rows: 3, level: 1 },
  { id: 'medium', label: 'Medium', blurb: '24 pieces', cols: 6, rows: 4, level: 2 },
  { id: 'hard', label: 'Hard', blurb: '40 pieces', cols: 8, rows: 5, level: 3 },
  { id: 'expert', label: 'Expert', blurb: '60 pieces', cols: 10, rows: 6, level: 4 },
];

export const TAB = 0.22;
export const SNAP_CELLS = 0.38;
export const TRAY_Y = 1.2;

export function isInTray(piece: Pick<JigsawPiece, 'placed' | 'y'>): boolean {
  return !piece.placed && piece.y >= 1;
}

export const CATEGORY_LABEL: Record<JigsawCategory, string> = {
  nature: 'Nature',
  landscapes: 'Landscapes',
  art: 'Art',
  travel: 'Travel',
  portraits: 'Portraits',
};
