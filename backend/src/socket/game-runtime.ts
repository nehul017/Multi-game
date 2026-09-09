import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../utils/constants';
import { GameError, GAME_ERROR_CODES } from '../games/core/errors';
import type { GameErrorPayload } from '../games/core/types';

const OUTBOUND_ALIASES: Record<string, string[]> = {
  [SOCKET_EVENTS.GAME.ROOM_CREATED]: [SOCKET_EVENTS.GAME.CREATED],
  [SOCKET_EVENTS.GAME.GAME_START]: [SOCKET_EVENTS.GAME.STARTED],
  [SOCKET_EVENTS.GAME.GAME_OVER]: [SOCKET_EVENTS.GAME.FINISHED],
  [SOCKET_EVENTS.GAME.PLAYER_JOINED]: [SOCKET_EVENTS.GAME.PLAYER_JOINED_ALIAS],
  [SOCKET_EVENTS.GAME.PLAYER_LEFT]: [SOCKET_EVENTS.GAME.PLAYER_LEFT_ALIAS],
  [SOCKET_EVENTS.GAME.MOVE_MADE]: [SOCKET_EVENTS.GAME.ACTION, SOCKET_EVENTS.GAME.STATE],
};

export const emitCanonical = (
  target: { emit: (event: string, payload: unknown) => void },
  event: string,
  payload: unknown
): void => {
  target.emit(event, payload);
  for (const alias of OUTBOUND_ALIASES[event] || []) {
    target.emit(alias, payload);
  }
};

export const emitGameError = (socket: Socket, error: GameError | GameErrorPayload | string): void => {
  const payload: GameErrorPayload =
    error instanceof GameError
      ? error.toPayload()
      : typeof error === 'string'
        ? { code: GAME_ERROR_CODES.INVALID_ACTION, message: error }
        : error;

  socket.emit(SOCKET_EVENTS.GAME.ERROR, payload);
  socket.emit('error', { message: payload.message });
};

const INBOUND_ALIASES: Array<[string, string]> = [
  [SOCKET_EVENTS.GAME.CREATE, SOCKET_EVENTS.GAME.CREATE_ROOM],
  [SOCKET_EVENTS.GAME.ACTION, SOCKET_EVENTS.GAME.MAKE_MOVE],
  [SOCKET_EVENTS.GAME.RECONNECT, SOCKET_EVENTS.GAME.JOIN_ROOM],
  [SOCKET_EVENTS.GAME.START, SOCKET_EVENTS.GAME.READY],
  [SOCKET_EVENTS.GAME.FINISH, SOCKET_EVENTS.GAME.SURRENDER],
];

export const bindInboundAliases = (socket: Socket): void => {
  for (const [alias, canonical] of INBOUND_ALIASES) {
    socket.on(alias, (...args: unknown[]) => {
      for (const listener of socket.listeners(canonical)) {
        (listener as (...cbArgs: unknown[]) => void)(...args);
      }
    });
  }
};
