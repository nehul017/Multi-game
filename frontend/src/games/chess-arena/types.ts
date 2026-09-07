export type ChessColor = 'white' | 'black';
export type ChessPieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type ChessView = 'menu' | 'modes' | 'computer' | 'rooms' | 'settings' | 'analyze';
export type ChessPlayMode = 'quick' | 'ranked' | 'casual' | 'computer' | 'local' | 'private';
export type ChessDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
export type ChessBoardTheme = 'default' | 'dark' | 'neon' | 'classic' | 'premium';
export type ChessPieceStyle = 'royal' | 'classic';
export type ChessAnimSpeed = 'off' | 'fast' | 'normal' | 'slow';
export type ChessOrientationMode = 'auto' | 'white' | 'black';
export type ConnectionStatus =
  | 'offline'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'opponent-disconnected'
  | 'opponent-reconnecting'
  | 'finished';

export interface ChessPos {
  row: number;
  col: number;
}

export interface ChessBoardPiece {
  type: ChessPieceType;
  color: ChessColor;
  hasMoved?: boolean;
}

export type ChessGrid = Array<Array<ChessBoardPiece | null>>;

export interface ChessMoveInput {
  from: ChessPos;
  to: ChessPos;
  promotion?: ChessPieceType;
}

export interface ChessSanMove {
  san: string;
  from: string;
  to: string;
  color: ChessColor;
  captured?: boolean;
  check?: boolean;
  checkmate?: boolean;
  castle?: boolean;
}

export interface ChessClockState {
  white: number;
  black: number;
  active: ChessColor | null;
}

export interface ChessPlayerInfo {
  id: string;
  username: string;
  avatar?: string;
  rating: number;
  level?: number;
  color: ChessColor;
  isBot?: boolean;
  isLocal?: boolean;
}

export interface ChessResultStats {
  outcome: 'win' | 'loss' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'draw' | 'resign' | 'timeout' | 'agreement';
  moves: number;
  captures: number;
  durationMs: number;
  eloChange?: number;
  xp?: number;
  coins?: number;
}

export interface ChessSettings {
  boardTheme: ChessBoardTheme;
  pieceStyle: ChessPieceStyle;
  animationSpeed: ChessAnimSpeed;
  masterVolume: number;
  effectsVolume: number;
  musicVolume: number;
  muted: boolean;
  moveSound: boolean;
  captureSound: boolean;
  coordinates: boolean;
  legalHints: boolean;
  lastMoveHighlight: boolean;
  showCaptured: boolean;
  orientation: ChessOrientationMode;
}

export interface ChessModeInfo {
  id: ChessPlayMode;
  name: string;
  blurb: string;
}

export interface ChessTimeControl {
  id: string;
  label: string;
  seconds: number;
}

export interface EngineEval {
  cp: number | null;
  mate: number | null;
  bestMove: string | null;
  depth: number;
}

export interface ChessEnginePort {
  isAvailable(): boolean;
  evaluate(fen: string): Promise<EngineEval | null>;
  bestMove(fen: string): Promise<string | null>;
  terminate(): void;
}

export type AnnotationKind = 'brilliant' | 'best' | 'mistake' | 'blunder';

export interface MoveAnnotation {
  ply: number;
  kind: AnnotationKind;
  comment: string;
}
