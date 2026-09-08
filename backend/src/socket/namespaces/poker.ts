import { Server, Socket } from 'socket.io';
import { AppError } from '../../utils/AppError';
import { SOCKET_EVENTS } from '../../utils/constants';
import { pokerService, sanitizeTableState } from '../../services/poker.service';
import type { PokerActionInput, PokerGameType, TableState } from '../../games/poker/core/game-state';

const POKER = SOCKET_EVENTS.POKER;

const emitError = (socket: Socket, error: unknown): void => {
  const status = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Unexpected poker error';
  const code =
    status === 400
      ? 'INVALID_ACTION'
      : status === 401
        ? 'UNAUTHORIZED'
        : status === 403
          ? 'FORBIDDEN'
          : status === 404
            ? 'NOT_FOUND'
            : status === 409
              ? 'CONFLICT'
              : 'INTERNAL';
  socket.emit(POKER.ERROR, { code, message, status });
};

const requireUser = (socket: Socket) => {
  if (!socket.user) throw new AppError('Authentication required', 401);
  return {
    userId: socket.user._id.toString(),
    username: socket.user.username,
    avatar: socket.user.avatar || '',
  };
};

const asRecord = (payload: unknown): Record<string, unknown> =>
  payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

const roomName = (tableId: string) => `poker:${tableId}`;

const broadcastTable = (io: Server, state: TableState, extra?: { event: string; payload?: unknown }) => {
  const gameNs = io.of('/game');
  const room = gameNs.adapter.rooms.get(roomName(state.tableId));
  if (!room) return;

  for (const socketId of room) {
    const socket = gameNs.sockets.get(socketId);
    if (!socket?.user) continue;
    const viewerId = socket.user._id.toString();
    const publicState = sanitizeTableState(state, viewerId);
    socket.emit(POKER.TABLE_STATE, publicState);
    if (extra) socket.emit(extra.event, extra.payload ?? publicState);
  }
};

export const setupPokerHandlers = (io: Server): void => {
  const gameNs = io.of('/game');

  pokerService.onTableEvent((tableId, state, event) => {
    broadcastTable(io, state);
    switch (event.type) {
      case 'player-joined':
        broadcastTable(io, state, { event: POKER.PLAYER_JOINED, payload: { tableId, userId: event.userId } });
        break;
      case 'player-left':
        broadcastTable(io, state, { event: POKER.PLAYER_LEFT, payload: { tableId, userId: event.userId } });
        break;
      case 'hand-start':
        broadcastTable(io, state, { event: POKER.HAND_START });
        broadcastTable(io, state, { event: POKER.CARDS_DEALT });
        break;
      case 'community':
        broadcastTable(io, state, { event: POKER.COMMUNITY_UPDATE });
        break;
      case 'action-accepted':
        broadcastTable(io, state, {
          event: POKER.ACTION_ACCEPTED,
          payload: { tableId, userId: event.userId, action: event.action },
        });
        break;
      case 'turn':
        broadcastTable(io, state, { event: POKER.TURN });
        break;
      case 'draw-complete':
        broadcastTable(io, state, { event: POKER.DRAW_COMPLETE });
        break;
      case 'showdown':
        broadcastTable(io, state, { event: POKER.SHOWDOWN });
        break;
      case 'hand-result':
        broadcastTable(io, state, { event: POKER.HAND_RESULT });
        break;
      case 'pot-update':
        broadcastTable(io, state, { event: POKER.POT_UPDATE });
        break;
      case 'balance-update':
        gameNs.to(roomName(tableId)).emit(POKER.BALANCE_UPDATE, {
          userId: event.userId,
          balance: event.balance,
        });
        break;
      case 'timer':
        broadcastTable(io, state, { event: POKER.TIMER, payload: { actionDeadline: state.actionDeadline } });
        break;
      default:
        break;
    }
  });

  gameNs.on('connection', (socket: Socket) => {
    socket.on(POKER.LOBBY, async (payload: unknown) => {
      try {
        requireUser(socket);
        const data = asRecord(payload);
        const gameType = typeof data.gameType === 'string' ? (data.gameType as PokerGameType) : undefined;
        const tables = await pokerService.listTables(gameType);
        socket.emit(POKER.LOBBY, { tables, config: pokerService.getPublicConfig() });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(POKER.TABLE_CREATE, async (payload: unknown) => {
      try {
        const user = requireUser(socket);
        const data = asRecord(payload);
        const gameType = data.gameType as PokerGameType;
        if (!gameType) throw new AppError('gameType is required', 400);
        const table = await pokerService.createTable(user.userId, {
          gameType,
          name: typeof data.name === 'string' ? data.name : undefined,
          maxSeats: data.maxSeats ? Number(data.maxSeats) : undefined,
          smallBlind: data.smallBlind ? Number(data.smallBlind) : undefined,
          bigBlind: data.bigBlind ? Number(data.bigBlind) : undefined,
          fillBots: false,
        });
        socket.join(roomName(table.tableId));
        socket.emit(POKER.TABLE_STATE, table);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(POKER.TABLE_JOIN, async (payload: unknown) => {
      try {
        const user = requireUser(socket);
        const data = asRecord(payload);
        const tableId = String(data.tableId || '');
        if (!tableId) throw new AppError('tableId is required', 400);
        const snapshot = await pokerService.getTable(tableId, user.userId);
        const buyIn = Number(data.buyIn);
        const chips = Number.isFinite(buyIn) && buyIn > 0 ? buyIn : snapshot.buyIn.min;
        const seatIndex = data.seatIndex == null ? undefined : Number(data.seatIndex);
        const state = await pokerService.sit(user.userId, user.username, user.avatar, tableId, chips, seatIndex);
        socket.join(roomName(tableId));
        socket.emit(POKER.TABLE_STATE, state);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(POKER.TABLE_LEAVE, async (payload: unknown) => {
      try {
        const user = requireUser(socket);
        const tableId = String(asRecord(payload).tableId || '');
        if (!tableId) throw new AppError('tableId is required', 400);
        const result = await pokerService.leave(user.userId, tableId);
        socket.leave(roomName(tableId));
        socket.emit(POKER.BALANCE_UPDATE, { userId: user.userId, balance: result.balance, chipsReturned: result.chipsReturned });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(POKER.ACTION, async (payload: unknown) => {
      try {
        const user = requireUser(socket);
        const data = asRecord(payload);
        const tableId = String(data.tableId || '');
        if (!tableId) throw new AppError('tableId is required', 400);
        const action: PokerActionInput = {
          type: data.type as PokerActionInput['type'],
          amount: data.amount == null ? undefined : Number(data.amount),
          discardIndexes: Array.isArray(data.discardIndexes)
            ? data.discardIndexes.map((index) => Number(index))
            : undefined,
        };
        const state = await pokerService.action(user.userId, tableId, action);
        socket.emit(POKER.ACTION_ACCEPTED, { tableId, action });
        socket.emit(POKER.TABLE_STATE, state);
      } catch (error) {
        socket.emit(POKER.ACTION_REJECTED, {
          message: error instanceof AppError ? error.message : 'Action rejected',
        });
        emitError(socket, error);
      }
    });

    socket.on(POKER.DRAW, async (payload: unknown) => {
      try {
        const user = requireUser(socket);
        const data = asRecord(payload);
        const tableId = String(data.tableId || '');
        const discardIndexes = Array.isArray(data.discardIndexes)
          ? data.discardIndexes.map((index) => Number(index))
          : [];
        const state = await pokerService.action(user.userId, tableId, { type: 'draw', discardIndexes });
        socket.emit(POKER.DRAW_COMPLETE, state);
        socket.emit(POKER.TABLE_STATE, state);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(POKER.RECONNECT, async (payload: unknown) => {
      try {
        const user = requireUser(socket);
        const tableId = typeof asRecord(payload).tableId === 'string' ? String(asRecord(payload).tableId) : undefined;
        const state = await pokerService.reconnect(user.userId, tableId);
        if (!state) {
          socket.emit(POKER.RECONNECT, { restored: false });
          return;
        }
        socket.join(roomName(state.tableId));
        socket.emit(POKER.RECONNECT, { restored: true });
        socket.emit(POKER.TABLE_STATE, state);
      } catch (error) {
        emitError(socket, error);
      }
    });
  });
};
