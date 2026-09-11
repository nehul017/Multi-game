export type CarromColor = 'white' | 'black';
export type CarromPieceKind = 'white' | 'black' | 'queen' | 'striker';
export type CarromPhase = 'aiming' | 'resolving' | 'board-complete' | 'match-complete';
export type CarromQueenStatus = 'on-board' | 'pending-cover' | 'covered';
export type CarromFoulKind = 'striker-pocketed' | 'last-coin-before-queen' | 'invalid-shot' | null;
export type CarromShotEventType = 'collision' | 'wall' | 'pocket' | 'rest';

export interface CarromPiece {
  id: string;
  kind: CarromPieceKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
}

export interface CarromShotEvent {
  t: number;
  type: CarromShotEventType;
  pieceId?: string;
  otherId?: string;
  kind?: CarromPieceKind;
}

export interface CarromShotInput {
  shotId: string;
  strikerX: number;
  strikerY: number;
  angle: number;
  power: number;
}

export interface CarromShotResult {
  shotId: string;
  playerId: string;
  input: CarromShotInput;
  events: CarromShotEvent[];
  durationMs: number;
  pocketedIds: string[];
  foul: CarromFoulKind;
  foulMessage: string | null;
  turnKept: boolean;
  boardWonBy: string | null;
}

export interface CarromBoardState {
  pieces: CarromPiece[];
  scores: Record<string, number>;
  pocketedCounts: {
    white: number;
    black: number;
    queen: boolean;
  };
  colors: Record<string, CarromColor>;
  queenStatus: CarromQueenStatus;
  queenPendingFor: string | null;
  queenCoveredBy: string | null;
  phase: CarromPhase;
  pointsToWin: number;
  foul: CarromFoulKind;
  foulMessage: string | null;
  lastShot: CarromShotResult | null;
  boardNumber: number;
  statusMessage: string;
}

export interface CarromAimState {
  angle: number;
  power: number;
  active: boolean;
}

export type CarromUiStatus =
  | 'connecting'
  | 'matchmaking'
  | 'waiting'
  | 'countdown'
  | 'your-turn'
  | 'opponent-turn'
  | 'resolving'
  | 'queen'
  | 'foul'
  | 'reconnecting'
  | 'opponent-disconnected'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'finished';
