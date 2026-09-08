import { Server, Socket } from 'socket.io';
import { AppError } from '../../utils/AppError';
import { FRUIT_SLOTS_GAME_ID } from '../../games/fruit-slots/types';
import { fruitSlotsService } from '../../services/fruit-slots.service';
import { SOCKET_EVENTS } from '../../utils/constants';

const emitError = (socket: Socket, error: unknown): void => {
  const status = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Unexpected game error';
  const code =
    status === 400
      ? 'INVALID_REQUEST'
      : status === 401
        ? 'UNAUTHORIZED'
        : status === 404
          ? 'NOT_FOUND'
          : status === 409
            ? 'SPIN_IN_PROGRESS'
            : status === 429
              ? 'RATE_LIMIT'
              : 'INTERNAL';

  socket.emit(SOCKET_EVENTS.GAME.ERROR, { code, message, status });
};

const requireUser = (socket: Socket): string => {
  if (!socket.user) {
    throw new AppError('Authentication required', 401);
  }
  return socket.user._id.toString();
};

const asRecord = (payload: unknown): Record<string, unknown> =>
  payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

const readGameId = (payload: unknown): string => {
  const data = asRecord(payload);
  return typeof data.gameId === 'string' ? data.gameId : FRUIT_SLOTS_GAME_ID;
};

export const setupFruitSlotsHandlers = (io: Server): void => {
  const gameNs = io.of('/game');

  gameNs.on('connection', (socket: Socket) => {
    socket.on(SOCKET_EVENTS.GAME.JOIN, async (payload: unknown) => {
      try {
        const userId = requireUser(socket);
        const gameId = readGameId(payload);
        const joined = await fruitSlotsService.join(userId, gameId);
        socket.join(`slots:${gameId}:${userId}`);
        socket.emit(SOCKET_EVENTS.GAME.STATE, joined.state);
        socket.emit(SOCKET_EVENTS.GAME.BALANCE, { balance: joined.state.balance });
        socket.emit(SOCKET_EVENTS.GAME.HISTORY, { items: joined.history });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(SOCKET_EVENTS.GAME.LEAVE, async (payload: unknown) => {
      try {
        const userId = requireUser(socket);
        const gameId = readGameId(payload);
        await fruitSlotsService.leave(userId, gameId);
        socket.leave(`slots:${gameId}:${userId}`);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on(SOCKET_EVENTS.GAME.SPIN, async (payload: unknown) => {
      try {
        const userId = requireUser(socket);
        const data = asRecord(payload);
        const gameId = readGameId(payload);
        const bet = Number(data.bet);
        const requestId = typeof data.requestId === 'string' ? data.requestId : '';

        const result = await fruitSlotsService.spin(userId, gameId, bet, requestId);
        socket.emit(SOCKET_EVENTS.GAME.SPIN_RESULT, result);
        socket.emit(SOCKET_EVENTS.GAME.BALANCE, { balance: result.balanceAfter });

        const history = await fruitSlotsService.getHistory(userId, gameId);
        socket.emit(SOCKET_EVENTS.GAME.HISTORY, { items: history });
      } catch (error) {
        emitError(socket, error);
      }
    });
  });
};
