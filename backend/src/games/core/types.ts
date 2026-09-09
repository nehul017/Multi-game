import { GameEngine } from '../engine';

export type GameLifecycle =
  | 'created'
  | 'waiting'
  | 'ready'
  | 'starting'
  | 'active'
  | 'paused'
  | 'finished'
  | 'persisted';

export type GameRuntimeKind = 'match' | 'table' | 'session' | 'local';

export interface GameAction {
  gameId: string;
  matchId?: string;
  roomId?: string;
  playerId?: string;
  actionId: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface GamePlayerSlot {
  socketId: string;
  ready: boolean;
  connected: boolean;
  disconnectedAt?: number;
}

export interface GameRoom {
  matchId: string;
  roomId: string;
  gameType: string;
  players: Map<string, GamePlayerSlot>;
  gameState: Record<string, unknown>;
  spectators: Set<string>;
  engine: GameEngine | null;
  drawOfferFrom?: string;
  tickTimer?: ReturnType<typeof setInterval>;
  botFillTimer?: ReturnType<typeof setTimeout>;
  botPlayTimer?: ReturnType<typeof setTimeout>;
  botTakeoverTimers?: Map<string, ReturnType<typeof setTimeout>>;
  botControlled?: Set<string>;
  settings?: Record<string, unknown>;
  lifecycle?: GameLifecycle;
}

export interface GameSessionMeta {
  roomId: string;
  matchId: string;
  gameType: string;
  ownerInstanceId: string;
  status: string;
  lifecycle: GameLifecycle;
  playerIds: string[];
  settings?: Record<string, unknown>;
  updatedAt: number;
}

export interface GameDefinition {
  gameId: string;
  gameType: string;
  name: string;
  kind: GameRuntimeKind;
  minPlayers: number;
  maxPlayers: number;
  joinInProgress?: boolean;
  fillBot?: boolean;
  fillEmptySeats?: boolean;
  highFrequency?: boolean;
  supportsPause?: boolean;
  config?: Record<string, unknown>;
  createEngine?: (players: string[], settings?: Record<string, unknown>) => GameEngine;
}

export interface GameResult {
  roomId: string;
  matchId: string;
  gameType: string;
  status: 'finished' | 'draw' | 'aborted';
  winner: string | null;
  scores?: Record<string, number>;
  reason: string;
  persisted: boolean;
}

export interface RemoteGameCommand {
  roomId: string;
  userId: string;
  username: string;
  action: string;
  moveData: Record<string, unknown>;
  actionId?: string;
  timestamp?: number;
}

export interface GameErrorPayload {
  code: string;
  message: string;
  gameId?: string;
  roomId?: string;
  actionId?: string;
}
