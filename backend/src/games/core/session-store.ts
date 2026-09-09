import { GameRoom } from './types';

class GameSessionStore {
  private readonly rooms = new Map<string, GameRoom>();
  private readonly reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  get(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  set(room: GameRoom): void {
    this.rooms.set(room.roomId, room);
  }

  delete(roomId: string): void {
    this.rooms.delete(roomId);
    for (const [key, timer] of this.reconnectTimers.entries()) {
      if (key.startsWith(`${roomId}:`)) {
        clearTimeout(timer);
        this.reconnectTimers.delete(key);
      }
    }
  }

  has(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  entries(): IterableIterator<[string, GameRoom]> {
    return this.rooms.entries();
  }

  values(): IterableIterator<GameRoom> {
    return this.rooms.values();
  }

  findByPlayer(userId: string): GameRoom[] {
    return Array.from(this.rooms.values()).filter((room) => room.players.has(userId));
  }

  findJoinable(gameType: string, userId: string, opts: { joinInProgress: boolean; maxPlayers: number }): GameRoom[] {
    const matches: GameRoom[] = [];
    for (const room of this.rooms.values()) {
      if (room.gameType !== gameType || room.players.has(userId)) continue;
      if (room.players.size >= opts.maxPlayers) continue;
      if (!opts.joinInProgress && room.engine) continue;
      matches.push(room);
    }
    return matches;
  }

  scheduleReconnect(roomId: string, userId: string, delayMs: number, onExpire: () => void): void {
    const key = `${roomId}:${userId}`;
    const existing = this.reconnectTimers.get(key);
    if (existing) clearTimeout(existing);
    this.reconnectTimers.set(
      key,
      setTimeout(() => {
        this.reconnectTimers.delete(key);
        onExpire();
      }, delayMs)
    );
  }

  clearReconnect(roomId: string, userId: string): void {
    const key = `${roomId}:${userId}`;
    const existing = this.reconnectTimers.get(key);
    if (existing) {
      clearTimeout(existing);
      this.reconnectTimers.delete(key);
    }
  }

  /** Test helper */
  clear(): void {
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    this.reconnectTimers.clear();
    this.rooms.clear();
  }
}

export const gameSessionStore = new GameSessionStore();
