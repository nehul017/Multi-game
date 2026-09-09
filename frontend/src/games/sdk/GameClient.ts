import { useSocketStore } from '@/store/socket.store';
import { SOCKET_EVENTS } from '@/constants/socket';
import { createActionId, GAME_CLIENT_EVENTS } from './events';

export type GameClientEvent =
  | 'state'
  | 'score'
  | 'error'
  | 'started'
  | 'finished'
  | 'joined'
  | 'reconnected';

type GameClientHandler = (payload: unknown) => void;

export interface GameActionInput {
  type: string;
  payload?: Record<string, unknown>;
  roomId?: string;
  matchId?: string;
}

export interface GameClientOptions {
  gameId: string;
  gameType?: string;
  roomId?: string;
  matchId?: string;
  playerId?: string;
}

/**
 * Shared realtime client. Reuses the existing authenticated /game socket.
 * Does not open a second Socket.IO connection.
 */
export class GameClient {
  readonly gameId: string;
  readonly gameType: string;
  private roomId?: string;
  private matchId?: string;
  private readonly playerId?: string;
  private readonly listeners = new Map<GameClientEvent, Set<GameClientHandler>>();
  private readonly bindings: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

  constructor(options: GameClientOptions) {
    this.gameId = options.gameId;
    this.gameType = options.gameType || options.gameId;
    this.roomId = options.roomId;
    this.matchId = options.matchId;
    this.playerId = options.playerId;
    this.bindServerEvents();
  }

  get currentRoomId(): string | undefined {
    return this.roomId;
  }

  create(settings?: Record<string, unknown>): void {
    this.emit(GAME_CLIENT_EVENTS.create, { gameType: this.gameType, settings });
  }

  join(roomId = this.roomId): void {
    if (!roomId) return;
    this.roomId = roomId;
    this.emit(GAME_CLIENT_EVENTS.join, { roomId });
  }

  leave(roomId = this.roomId): void {
    if (!roomId) return;
    this.emit(GAME_CLIENT_EVENTS.leave, { roomId });
  }

  ready(roomId = this.roomId): void {
    if (!roomId) return;
    this.emit(GAME_CLIENT_EVENTS.ready, { roomId });
  }

  reconnect(roomId = this.roomId): void {
    if (!roomId) return;
    this.roomId = roomId;
    this.emit(GAME_CLIENT_EVENTS.reconnect, { roomId });
  }

  sendAction(input: GameActionInput | string, payload?: Record<string, unknown>): void {
    const action: GameActionInput =
      typeof input === 'string' ? { type: input, payload: payload || {} } : input;
    const roomId = action.roomId || this.roomId;
    if (!roomId) return;

    this.emit(GAME_CLIENT_EVENTS.action, {
      gameId: this.gameId,
      matchId: action.matchId || this.matchId,
      roomId,
      playerId: this.playerId,
      actionId: createActionId(),
      type: action.type,
      payload: action.payload || {},
      timestamp: Date.now(),
      action: action.type,
      moveData: action.payload || {},
    });
  }

  onState(handler: GameClientHandler): () => void {
    return this.on('state', handler);
  }

  onScore(handler: GameClientHandler): () => void {
    return this.on('score', handler);
  }

  onError(handler: GameClientHandler): () => void {
    return this.on('error', handler);
  }

  on(event: GameClientEvent, handler: GameClientHandler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  restore(): void {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('activeGameRoom');
    if (stored) this.reconnect(stored);
  }

  destroy(): void {
    const { gameOff } = useSocketStore.getState();
    for (const binding of this.bindings) {
      gameOff(binding.event, binding.handler);
    }
    this.bindings.length = 0;
    this.listeners.clear();
  }

  private emit(event: string, data?: unknown): void {
    useSocketStore.getState().gameEmit(event, data);
  }

  private notify(event: GameClientEvent, payload: unknown): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }

  private bindServerEvents(): void {
    const { gameOn } = useSocketStore.getState();
    const bind = (event: string, handler: (...args: unknown[]) => void) => {
      gameOn(event, handler);
      this.bindings.push({ event, handler });
    };

    bind(SOCKET_EVENTS.GAME.ROOM_CREATED, (payload) => {
      const data = payload as { roomId?: string; matchId?: string };
      if (data.roomId) this.roomId = data.roomId;
      if (data.matchId) this.matchId = String(data.matchId);
    });
    bind(SOCKET_EVENTS.GAME.MATCH_FOUND, (payload) => {
      const data = payload as { roomId?: string; matchId?: string };
      if (data.roomId) this.roomId = data.roomId;
      if (data.matchId) this.matchId = String(data.matchId);
      this.notify('joined', payload);
      this.notify('state', payload);
    });
    bind(SOCKET_EVENTS.GAME.RECONNECTED, (payload) => {
      this.notify('reconnected', payload);
      this.notify('state', payload);
    });
    bind(SOCKET_EVENTS.GAME.MOVE_MADE, (payload) => this.notify('state', payload));
    bind(SOCKET_EVENTS.GAME.STATE, (payload) => this.notify('state', payload));
    bind(SOCKET_EVENTS.GAME.GAME_START, (payload) => this.notify('started', payload));
    bind(SOCKET_EVENTS.GAME.STARTED, (payload) => this.notify('started', payload));
    bind(SOCKET_EVENTS.GAME.GAME_OVER, (payload) => this.notify('finished', payload));
    bind(SOCKET_EVENTS.GAME.FINISHED, (payload) => this.notify('finished', payload));
    bind(SOCKET_EVENTS.GAME.SCORE, (payload) => this.notify('score', payload));
    bind(SOCKET_EVENTS.GAME.ERROR, (payload) => this.notify('error', payload));
    bind('error', (payload) => this.notify('error', payload));
  }
}

export function createGameClient(options: GameClientOptions): GameClient {
  return new GameClient(options);
}
