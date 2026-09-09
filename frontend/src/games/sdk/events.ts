import { SOCKET_EVENTS } from '@/constants/socket';

/** Maps GameClient methods onto the existing /game namespace. */
export const GAME_CLIENT_EVENTS = {
  create: SOCKET_EVENTS.GAME.CREATE_ROOM,
  join: SOCKET_EVENTS.GAME.JOIN_ROOM,
  leave: SOCKET_EVENTS.GAME.LEAVE_ROOM,
  ready: SOCKET_EVENTS.GAME.READY,
  action: SOCKET_EVENTS.GAME.MAKE_MOVE,
  reconnect: SOCKET_EVENTS.GAME.JOIN_ROOM,
  start: SOCKET_EVENTS.GAME.READY,
  finish: SOCKET_EVENTS.GAME.SURRENDER,
  pause: SOCKET_EVENTS.GAME.PAUSE,
  resume: SOCKET_EVENTS.GAME.RESUME,
} as const;

export function createActionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
