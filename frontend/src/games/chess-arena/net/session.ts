import type { ChessMoveInput } from '../types';

interface ChessNetHandlers {
  startMatchmaking: (slug: string, settings?: Record<string, unknown>) => void;
  joinRoom: (roomId: string) => void;
  makeMove: (payload: { roomId: string; action: string; moveData: Record<string, unknown> }) => void;
  cancelMatchmaking: () => void;
  surrender: (roomId: string) => void;
  offerDraw: (roomId: string) => void;
  acceptDraw: (roomId: string) => void;
  slug: string;
}

export function createChessNetwork(handlers: ChessNetHandlers) {
  return {
    findMatch(settings: Record<string, unknown>) {
      handlers.startMatchmaking(handlers.slug, settings);
    },
    join(roomId: string) {
      handlers.joinRoom(roomId);
    },
    move(roomId: string, move: ChessMoveInput) {
      handlers.makeMove({ roomId, action: 'move', moveData: { ...move } });
    },
    resign(roomId: string) {
      handlers.surrender(roomId);
    },
    offerDraw(roomId: string) {
      handlers.offerDraw(roomId);
    },
    acceptDraw(roomId: string) {
      handlers.acceptDraw(roomId);
    },
    cancel() {
      handlers.cancelMatchmaking();
    },
  };
}
