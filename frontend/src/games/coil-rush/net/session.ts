import type { CoilMode, CoilSteerInput } from '../types';

export interface CoilMatchSession {
  mode: CoilMode;
  roomId?: string;
  connected: boolean;
}

export interface CoilNetworkClient {
  findMatch(session: Pick<CoilMatchSession, 'mode'> & { skinId: string }): void;
  join(roomId: string): void;
  steer(roomId: string, input: CoilSteerInput): void;
  respawn(roomId: string): void;
  leave(): void;
}

/** Maps Coil Rush session actions onto the existing game socket. */
export function createCoilNetwork(handlers: {
  startMatchmaking: (slug: string, settings?: Record<string, unknown>) => void;
  joinRoom: (roomId: string) => void;
  makeMove: (move: { roomId: string; action?: string; moveData: Record<string, unknown> }) => void;
  cancelMatchmaking: () => void;
  slug: string;
  playerId?: string;
}): CoilNetworkClient {
  return {
    findMatch({ mode, skinId }) {
      handlers.startMatchmaking(handlers.slug, {
        mode,
        botCount: mode === 'friends' ? 0 : undefined,
        skinByPlayer: handlers.playerId ? { [handlers.playerId]: skinId } : {},
      });
    },
    join(roomId) {
      handlers.joinRoom(roomId);
    },
    steer(roomId, input) {
      handlers.makeMove({ roomId, action: 'steer', moveData: { angle: input.angle, boost: input.boost } });
    },
    respawn(roomId) {
      handlers.makeMove({ roomId, action: 'steer', moveData: { respawn: true } });
    },
    leave() {
      handlers.cancelMatchmaking();
    },
  };
}
