import { Server, Socket } from 'socket.io';
import { matchService } from '../../services/match.service';
import { rewardService } from '../../services/reward.service';
import { notificationService } from '../../services/notification.service';
import {
  BOT_FILL_MS,
  FILL_BOT_GAMES,
  JOIN_IN_PROGRESS_GAMES,
  SOCKET_EVENTS,
  maxPlayersFor,
  minPlayersToStart,
} from '../../utils/constants';
import { createGameEngine, serializeGameState, serializeSnakeTick } from '../../games/factory';
import { GameEngine } from '../../games/engine';
import { SNAKE_TICK_MS } from '../../games/snake-multiplayer';
import { isBotPlayerId, ludoBotId, pickLudoBotMove } from '../../games/ludo-bot';

interface GameRoom {
  matchId: string;
  roomId: string;
  gameType: string;
  players: Map<string, { socketId: string; ready: boolean; connected: boolean }>;
  gameState: Record<string, unknown>;
  spectators: Set<string>;
  engine: GameEngine | null;
  drawOfferFrom?: string;
  tickTimer?: ReturnType<typeof setInterval>;
  botFillTimer?: ReturnType<typeof setTimeout>;
  botPlayTimer?: ReturnType<typeof setTimeout>;
  settings?: Record<string, unknown>;
}

const activeRooms = new Map<string, GameRoom>();
const matchmakingQueue = new Map<string, Set<string>>();
const hydratingRooms = new Map<string, Promise<GameRoom | null>>();

const toPlayerId = (userId: unknown): string => {
  if (userId == null) return '';
  if (typeof userId === 'object' && userId !== null && '_id' in userId) {
    return String((userId as { _id: unknown })._id);
  }
  return String(userId);
};

const replayMatchMoves = (engine: GameEngine, moves: Array<{ player: unknown; action: string; data?: Record<string, unknown> }>): void => {
  for (const move of moves) {
    const playerId = toPlayerId(move.player);
    const data: Record<string, unknown> = { ...(move.data || {}) };

    // Engines that key off `action` (Ludo/Quiz) need it on the payload
    if (!data.action && ['roll', 'move', 'answer', 'direction'].includes(move.action)) {
      data.action = move.action;
    }

    // Replay Ludo rolls with the recorded dice so board state matches history
    if ((data.action === 'roll' || move.action === 'roll') && typeof data.dice === 'number') {
      data._forcedDice = data.dice;
    }

    engine.makeMove(playerId, data);
  }
};

const hydrateRoomFromDb = async (roomId: string): Promise<GameRoom | null> => {
  const existing = activeRooms.get(roomId);
  if (existing) return existing;

  const pending = hydratingRooms.get(roomId);
  if (pending) return pending;

  const work = (async (): Promise<GameRoom | null> => {
    const already = activeRooms.get(roomId);
    if (already) return already;

    const match = await matchService.getMatchByRoom(roomId);
    if (!['waiting', 'playing'].includes(match.status)) return null;

    const playerIds = match.players.map((p) => toPlayerId(p.userId));
    const canHydrateSolo = JOIN_IN_PROGRESS_GAMES.has(match.gameType);
    const engine =
      match.status === 'playing' && (playerIds.length >= 2 || (canHydrateSolo && playerIds.length >= 1))
        ? createGameEngine(match.gameType, playerIds, (match.settings || {}) as Record<string, unknown>)
        : null;

    if (engine && match.moves?.length) {
      replayMatchMoves(engine, match.moves);
    }

    const room: GameRoom = {
      matchId: match._id.toString(),
      roomId: match.roomId,
      gameType: match.gameType,
      players: new Map(),
      gameState: engine ? serializeGameState(engine) : {},
      spectators: new Set(match.spectators?.map((id) => toPlayerId(id)) || []),
      engine,
      settings: (match.settings || {}) as Record<string, unknown>,
    };

    for (const player of match.players) {
      const playerId = toPlayerId(player.userId);
      room.players.set(playerId, {
        socketId: '',
        ready: match.status === 'playing',
        connected: false,
      });
    }

    activeRooms.set(roomId, room);
    return room;
  })().finally(() => {
    hydratingRooms.delete(roomId);
  });

  hydratingRooms.set(roomId, work);
  return work;
};

const buildMatchPayload = (
  room: GameRoom,
  match: Awaited<ReturnType<typeof matchService.getMatch>>
) => {
  const players = match.players.map((player) => {
    const playerId = toPlayerId(player.userId);
    const populated = player.userId as unknown as {
      _id?: unknown;
      username?: string;
      avatar?: string;
      elo?: number;
    };
    return {
      userId: playerId,
      username: populated?.username || 'Player',
      avatar: populated?.avatar,
      elo: player.elo ?? populated?.elo ?? 1000,
      isReady: room.players.get(playerId)?.ready ?? false,
    };
  });

  for (const [playerId] of room.players.entries()) {
    if (!isBotPlayerId(playerId) || players.some((p) => p.userId === playerId)) continue;
    players.push({
      userId: playerId,
      username: 'Bot',
      avatar: undefined,
      elo: 1000,
      isReady: true,
    });
  }

  return {
    roomId: room.roomId,
    matchId: room.matchId,
    gameType: room.gameType,
    status: room.engine ? 'playing' : match.status,
    players,
    moves: match.moves,
    gameState: room.engine ? serializeGameState(room.engine) : room.gameState,
  };
};

const emitRoomState = (
  socket: Socket,
  room: GameRoom,
  match: Awaited<ReturnType<typeof matchService.getMatch>>,
  isRejoin: boolean
): void => {
  const payload = buildMatchPayload(room, match);
  socket.emit(
    isRejoin ? SOCKET_EVENTS.GAME.RECONNECTED : SOCKET_EVENTS.GAME.MATCH_FOUND,
    payload
  );
};

const clearRoomTimers = (room: GameRoom): void => {
  if (room.tickTimer) {
    clearInterval(room.tickTimer);
    room.tickTimer = undefined;
  }
  if (room.botFillTimer) {
    clearTimeout(room.botFillTimer);
    room.botFillTimer = undefined;
  }
  if (room.botPlayTimer) {
    clearTimeout(room.botPlayTimer);
    room.botPlayTimer = undefined;
  }
};

const finishMatch = async (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  winnerId: string | null,
  reason: 'finished' | 'draw' | 'surrender'
): Promise<void> => {
  clearRoomTimers(room);
  const botWon = Boolean(winnerId && isBotPlayerId(winnerId));
  const rewards = botWon
    ? []
    : await rewardService.settleMatch(room.matchId, winnerId, reason);
  if (botWon) {
    try {
      await matchService.updateMatchStatus(room.matchId, 'finished');
    } catch {
      // match may already be closed
    }
  }

  gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.GAME_OVER, {
    winner: winnerId,
    reason,
    rewards,
    gameState: room.engine ? serializeGameState(room.engine) : room.gameState,
  });

  activeRooms.delete(room.roomId);
};

const startSnakeLoop = (gameNs: ReturnType<Server['of']>, room: GameRoom): void => {
  if (room.gameType !== 'snake-multiplayer' || !room.engine) return;
  clearRoomTimers(room);

  const engine = room.engine as GameEngine & { tick?: () => void };
  room.tickTimer = setInterval(async () => {
    if (!room.engine || typeof engine.tick !== 'function') return;
    engine.tick();
    room.gameState = serializeSnakeTick(room.engine);
    gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.MOVE_MADE, {
      playerId: null,
      action: 'tick',
      data: {},
      gameState: room.gameState,
      timestamp: new Date(),
    });

    if (room.engine.isGameOver()) {
      const state = room.engine.getGameState();
      await finishMatch(
        gameNs,
        room,
        state.winner,
        state.status === 'draw' ? 'draw' : 'finished'
      );
    }
  }, SNAKE_TICK_MS);
};

const startGameCountdown = (gameNs: ReturnType<Server['of']>, room: GameRoom): void => {
  const playerIds = Array.from(room.players.keys());
  room.engine = createGameEngine(room.gameType, playerIds, room.settings || {});
  if (room.engine) {
    room.gameState = serializeGameState(room.engine);
  }

  if (JOIN_IN_PROGRESS_GAMES.has(room.gameType)) {
    gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.GAME_START, {
      matchId: room.matchId,
      players: playerIds,
      gameState: room.gameState,
    });
    startSnakeLoop(gameNs, room);
    void matchService.getMatch(room.matchId).then((match) => {
      gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.MATCH_FOUND, buildMatchPayload(room, match));
    }).catch(() => undefined);
    return;
  }

  let countdown = 3;
  const countdownInterval = setInterval(() => {
    gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.COUNTDOWN, { count: countdown });
    countdown--;
    if (countdown < 0) {
      clearInterval(countdownInterval);
      if (room.engine) {
        room.gameState = serializeGameState(room.engine);
      }
      gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.GAME_START, {
        matchId: room.matchId,
        players: playerIds,
        gameState: room.gameState,
      });
      startSnakeLoop(gameNs, room);
      scheduleBotTurn(gameNs, room, 1100);
    }
  }, 1000);
};

const broadcastEngineState = (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  playerId: string | null,
  action: string
): void => {
  if (!room.engine) return;
  room.gameState = serializeGameState(room.engine);
  gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.MOVE_MADE, {
    playerId,
    action,
    data: playerId ? { playerId } : {},
    gameState: room.gameState,
    timestamp: new Date(),
  });
};

const tryStartGame = async (gameNs: ReturnType<Server['of']>, room: GameRoom): Promise<void> => {
  if (room.engine) return;
  const allReady = Array.from(room.players.values()).every((p) => p.ready);
  if (allReady && room.players.size >= minPlayersToStart(room.gameType)) {
    if (room.botFillTimer) {
      clearTimeout(room.botFillTimer);
      room.botFillTimer = undefined;
    }
    await matchService.updateMatchStatus(room.matchId, 'playing');
    startGameCountdown(gameNs, room);
  }
};

const roomHasBot = (room: GameRoom): boolean =>
  Array.from(room.players.keys()).some((id) => isBotPlayerId(id));

const humanPlayerCount = (room: GameRoom): number =>
  Array.from(room.players.keys()).filter((id) => !isBotPlayerId(id)).length;

const canFillBot = (room: GameRoom): boolean =>
  FILL_BOT_GAMES.has(room.gameType) && !room.engine && !roomHasBot(room) && humanPlayerCount(room) === 1;

const scheduleBotFill = (gameNs: ReturnType<Server['of']>, room: GameRoom): void => {
  if (!canFillBot(room)) {
    return;
  }
  if (room.botFillTimer) clearTimeout(room.botFillTimer);
  room.botFillTimer = setTimeout(() => {
    void fillBotIntoRoom(gameNs, room);
  }, BOT_FILL_MS);
};

const emitToRoomAndSocket = (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  event: string,
  payload: unknown,
  notifySocket?: Socket
): void => {
  gameNs.to(room.roomId).emit(event, payload);
  notifySocket?.emit(event, payload);
};

const resolveBotFillRoom = async (userId: string, roomId?: string): Promise<GameRoom | null> => {
  if (roomId) {
    try {
      const room = await hydrateRoomFromDb(roomId);
      if (room && room.players.has(userId)) return room;
    } catch {
      // fall through to in-memory search
    }
  }

  return (
    Array.from(activeRooms.values()).find(
      (entry) => canFillBot(entry) && entry.players.has(userId)
    ) || null
  );
};

const fillBotIntoRoom = async (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  notifySocket?: Socket
): Promise<void> => {
  if (!canFillBot(room)) {
    return;
  }

  if (room.botFillTimer) {
    clearTimeout(room.botFillTimer);
    room.botFillTimer = undefined;
  }

  const botId = ludoBotId(room.roomId);
  room.players.set(botId, { socketId: '', ready: true, connected: true });
  for (const player of room.players.values()) {
    player.ready = true;
  }

  emitToRoomAndSocket(
    gameNs,
    room,
    SOCKET_EVENTS.GAME.PLAYER_JOINED,
    {
      userId: botId,
      username: 'Bot',
      elo: 1000,
      playersCount: room.players.size,
    },
    notifySocket
  );

  try {
    const match = await matchService.getMatch(room.matchId);
    emitToRoomAndSocket(
      gameNs,
      room,
      SOCKET_EVENTS.GAME.MATCH_FOUND,
      buildMatchPayload(room, match),
      notifySocket
    );
  } catch (error) {
    console.error('Bot fill match payload failed:', error);
  }

  await tryStartGame(gameNs, room);
};

const applyEngineMove = async (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  playerId: string,
  movePayload: Record<string, unknown>,
  username: string
): Promise<boolean> => {
  if (!room.engine) return false;
  const historyBefore = room.engine.getGameState().moveHistory.length;
  const accepted = room.engine.makeMove(playerId, movePayload);
  if (!accepted) return false;

  const snapshot = serializeGameState(room.engine);
  room.gameState = snapshot;
  const lastApplied = room.engine.getGameState().moveHistory.slice(-1)[0];
  const persistData: Record<string, unknown> = {
    ...movePayload,
    ...(lastApplied?.data || {}),
  };
  if (lastApplied?.action && !persistData.action) {
    persistData.action = lastApplied.action;
  }

  const historyChanged = room.engine.getGameState().moveHistory.length > historyBefore;
  if (historyChanged) {
    gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.MOVE_MADE, {
      playerId,
      username,
      action: lastApplied?.action || (movePayload.action as string) || 'move',
      data: persistData,
      gameState: snapshot,
      timestamp: new Date(),
    });

    if (!isBotPlayerId(playerId)) {
      await matchService.addMove(
        room.matchId,
        playerId,
        lastApplied?.action || (movePayload.action as string) || 'move',
        persistData
      );
    }
  }

  if (room.engine.isGameOver()) {
    const state = room.engine.getGameState();
    await finishMatch(gameNs, room, state.winner, state.status === 'draw' ? 'draw' : 'finished');
    return true;
  }

  if (!isBotPlayerId(playerId)) {
    scheduleBotTurn(gameNs, room);
  }
  return true;
};

const scheduleBotTurn = (gameNs: ReturnType<Server['of']>, room: GameRoom, delay = 850): void => {
  if (!room.engine || room.engine.isGameOver() || !FILL_BOT_GAMES.has(room.gameType)) return;
  const current = room.engine.getGameState().currentPlayer;
  if (!current || !isBotPlayerId(current)) return;
  if (room.botPlayTimer) clearTimeout(room.botPlayTimer);
  room.botPlayTimer = setTimeout(() => {
    void runBotTurn(gameNs, room);
  }, delay);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const runBotTurn = async (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom
): Promise<void> => {
  for (let step = 0; step < 10; step++) {
    if (!room.engine || room.engine.isGameOver()) return;
    const botId = room.engine.getGameState().currentPlayer;
    if (!botId || !isBotPlayerId(botId)) return;

    const move = pickLudoBotMove(room.engine, botId);
    if (!move) return;

    const accepted = await applyEngineMove(gameNs, room, botId, move, 'Bot');
    if (!accepted || !room.engine || room.engine.isGameOver()) return;
    if (!isBotPlayerId(room.engine.getGameState().currentPlayer)) return;

    await sleep(move.action === 'roll' ? 1200 : 700);
  }
};

const admitPlayerToLiveGame = (
  gameNs: ReturnType<Server['of']>,
  room: GameRoom,
  userId: string
): boolean => {
  if (!room.engine || room.engine.isGameOver()) return false;
  const added = room.engine.addPlayer(userId);
  if (added) {
    broadcastEngineState(gameNs, room, userId, 'playerJoined');
  }
  return added;
};

export const setupGameNamespace = (io: Server): void => {
  const gameNs = io.of('/game');

  gameNs.on('connection', (socket: Socket) => {
    console.log(`Game: ${socket.user?.username} connected`);

    socket.on(SOCKET_EVENTS.GAME.MATCHMAKING, async (data: { gameSlug: string; settings?: Record<string, unknown> }) => {
      try {
        if (!socket.user) return;

        const gameType = data.gameSlug;
        const userId = socket.user._id.toString();

        if (!matchmakingQueue.has(gameType)) {
          matchmakingQueue.set(gameType, new Set());
        }
        const queue = matchmakingQueue.get(gameType)!;

        for (const [roomId, room] of activeRooms.entries()) {
          if (room.gameType !== gameType || room.players.has(userId)) {
            continue;
          }

          const joinInProgress = JOIN_IN_PROGRESS_GAMES.has(gameType);
          if (!joinInProgress && room.players.size !== 1) {
            continue;
          }
          if (room.players.size >= maxPlayersFor(gameType)) {
            continue;
          }

          const existingMatch = await matchService.getMatch(room.matchId);
          const canJoinWaiting = existingMatch.status === 'waiting';
          const canJoinPlaying = existingMatch.status === 'playing' && joinInProgress && !!room.engine;
          if (!canJoinWaiting && !canJoinPlaying) {
            continue;
          }

          await matchService.joinMatch(room.matchId, userId);
          room.players.set(userId, { socketId: socket.id, ready: true, connected: true });
          socket.join(roomId);
          queue.delete(userId);

          const creatorId = Array.from(room.players.keys()).find((id) => id !== userId);
          if (creatorId) {
            const creator = room.players.get(creatorId);
            if (creator) creator.ready = true;
          }

          if (canJoinPlaying) {
            admitPlayerToLiveGame(gameNs, room, userId);
          }

          gameNs.to(roomId).emit(SOCKET_EVENTS.GAME.PLAYER_JOINED, {
            userId: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
            elo: socket.user.elo,
            playersCount: room.players.size,
          });

          const updatedMatch = await matchService.getMatch(room.matchId);
          gameNs.to(roomId).emit(
            SOCKET_EVENTS.GAME.MATCH_FOUND,
            buildMatchPayload(room, updatedMatch)
          );

          if (canJoinWaiting) {
            await tryStartGame(gameNs, room);
          }
          return;
        }

        for (const [, room] of activeRooms.entries()) {
          if (room.gameType === gameType && room.players.size === 1 && room.players.has(userId)) {
            socket.join(room.roomId);
            queue.add(userId);
            socket.emit(SOCKET_EVENTS.GAME.ROOM_CREATED, {
              roomId: room.roomId,
              matchId: room.matchId,
              gameType,
            });
            return;
          }
        }

        queue.add(userId);

        const match = await matchService.createMatch(gameType, userId, data.settings || {});
        const roomId = match.roomId;

        const autoStart = JOIN_IN_PROGRESS_GAMES.has(gameType);
        const room: GameRoom = {
          matchId: match._id.toString(),
          roomId,
          gameType,
          players: new Map([[userId, { socketId: socket.id, ready: autoStart, connected: true }]]),
          gameState: {},
          spectators: new Set(),
          engine: null,
          settings: data.settings || {},
        };

        activeRooms.set(roomId, room);
        socket.join(roomId);

        socket.emit(SOCKET_EVENTS.GAME.ROOM_CREATED, {
          roomId,
          matchId: match._id,
          gameType,
        });

        if (autoStart) {
          await tryStartGame(gameNs, room);
        } else {
          scheduleBotFill(gameNs, room);
        }
      } catch (error) {
        console.error('Matchmaking error:', error);
        socket.emit('error', { message: 'Failed to find match' });
      }
    });

    socket.on(SOCKET_EVENTS.GAME.CANCEL_MATCHMAKING, async (data?: { roomId?: string }) => {
      if (!socket.user) return;
      const userId = socket.user._id.toString();

      for (const [gameType, queue] of matchmakingQueue.entries()) {
        queue.delete(userId);
        if (queue.size === 0) matchmakingQueue.delete(gameType);
      }

      const roomId = data?.roomId;
      if (!roomId) {
        for (const [id, room] of activeRooms.entries()) {
          if (room.players.size === 1 && room.players.has(userId)) {
            await handleLeaveRoom(gameNs, socket, id, room);
            break;
          }
        }
        return;
      }

      const room = activeRooms.get(roomId);
      if (room) {
        await handleLeaveRoom(gameNs, socket, roomId, room);
      }
    });

    socket.on(SOCKET_EVENTS.GAME.CREATE_ROOM, async (data: { gameType: string; settings?: Record<string, unknown> }) => {
      try {
        if (!socket.user) return;

        const match = await matchService.createMatch(data.gameType, socket.user._id.toString(), data.settings);
        const roomId = match.roomId;

        const autoStart = JOIN_IN_PROGRESS_GAMES.has(data.gameType);
        const room: GameRoom = {
          matchId: match._id.toString(),
          roomId,
          gameType: data.gameType,
          players: new Map([[socket.user._id.toString(), { socketId: socket.id, ready: autoStart, connected: true }]]),
          gameState: {},
          spectators: new Set(),
          engine: null,
        };

        activeRooms.set(roomId, room);
        socket.join(roomId);

        socket.emit(SOCKET_EVENTS.GAME.ROOM_CREATED, {
          roomId,
          matchId: match._id,
          gameType: data.gameType,
        });

        if (autoStart) {
          await tryStartGame(gameNs, room);
        } else {
          scheduleBotFill(gameNs, room);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    socket.on(SOCKET_EVENTS.GAME.JOIN_ROOM, async (data: { roomId: string }) => {
      try {
        if (!socket.user) return;

        const userId = socket.user._id.toString();
        const room = await hydrateRoomFromDb(data.roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const match = await matchService.getMatch(room.matchId);
        const isExistingPlayer = match.players.some((player) => toPlayerId(player.userId) === userId);

        if (isExistingPlayer) {
          room.players.set(userId, {
            socketId: socket.id,
            ready: room.players.get(userId)?.ready ?? match.status === 'playing',
            connected: true,
          });
        } else {
          await matchService.joinMatch(room.matchId, userId);
          room.players.set(userId, {
            socketId: socket.id,
            ready: JOIN_IN_PROGRESS_GAMES.has(room.gameType) || match.status === 'playing',
            connected: true,
          });
        }

        socket.join(data.roomId);

        if (!isExistingPlayer && room.engine && JOIN_IN_PROGRESS_GAMES.has(room.gameType)) {
          admitPlayerToLiveGame(gameNs, room, userId);
        }

        const refreshed = await matchService.getMatch(room.matchId);
        emitRoomState(socket, room, refreshed, isExistingPlayer);

        if (!isExistingPlayer && room.engine) {
          gameNs.to(data.roomId).emit(
            SOCKET_EVENTS.GAME.MATCH_FOUND,
            buildMatchPayload(room, refreshed)
          );
        }

        gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.PLAYER_JOINED, {
          userId: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
          elo: socket.user.elo,
          playersCount: room.players.size,
          reconnected: isExistingPlayer,
        });

        if (!isExistingPlayer && !room.engine && JOIN_IN_PROGRESS_GAMES.has(room.gameType)) {
          for (const player of room.players.values()) {
            player.ready = true;
          }
          await tryStartGame(gameNs, room);
        } else if (canFillBot(room)) {
          if (refreshed.status === 'playing') {
            await fillBotIntoRoom(gameNs, room, socket);
          } else {
            scheduleBotFill(gameNs, room);
          }
        }
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on(SOCKET_EVENTS.GAME.LEAVE_ROOM, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;
      await handleLeaveRoom(gameNs, socket, data.roomId, room);
    });

    socket.on(SOCKET_EVENTS.GAME.READY, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      const player = room.players.get(socket.user._id.toString());
      if (player) {
        player.ready = true;
      }

      await tryStartGame(gameNs, room);
    });

    socket.on(SOCKET_EVENTS.GAME.FILL_BOT, async (data: { roomId?: string }) => {
      if (!socket.user) return;
      const userId = socket.user._id.toString();
      try {
        const room = await resolveBotFillRoom(userId, data?.roomId);
        if (!room) {
          socket.emit('error', { message: 'No waiting Ludo match to fill with a bot' });
          return;
        }
        socket.join(room.roomId);
        await fillBotIntoRoom(gameNs, room, socket);
      } catch (error) {
        console.error('Fill bot error:', error);
        socket.emit('error', { message: 'Failed to start bot match' });
      }
    });

    socket.on(SOCKET_EVENTS.GAME.MAKE_MOVE, async (data: { roomId: string; action: string; moveData: Record<string, unknown> }) => {
      try {
        if (!socket.user) return;
        const room = activeRooms.get(data.roomId);
        if (!room) return;

        const userId = socket.user._id.toString();
        // Never trust client-forced dice / replay flags
        const movePayload: Record<string, unknown> = { ...(data.moveData || {}) };
        delete movePayload._forcedDice;

        if (room.engine) {
          const historyBefore = room.engine.getGameState().moveHistory.length;
          const accepted = room.engine.makeMove(userId, movePayload);
          if (!accepted) {
            if (room.gameType !== 'snake-multiplayer') {
              socket.emit('error', { message: 'Invalid move' });
            }
            return;
          }

          // Snapshot after the move — server is the single source of truth
          const snapshot = serializeGameState(room.engine);
          room.gameState = snapshot;

          const isSnakeSteer =
            room.gameType === 'snake-multiplayer' &&
            (data.action === 'steer' || data.action === 'direction');
          if (isSnakeSteer) {
            return;
          }

          const lastApplied = room.engine.getGameState().moveHistory.slice(-1)[0];
          const persistData: Record<string, unknown> = {
            ...movePayload,
            ...(lastApplied?.data || {}),
          };
          if (lastApplied?.action && !persistData.action) {
            persistData.action = lastApplied.action;
          }

          const historyChanged = room.engine.getGameState().moveHistory.length > historyBefore;

          if (historyChanged) {
            // Broadcast first so snake steering is not blocked on Mongo
            gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.MOVE_MADE, {
              playerId: userId,
              username: socket.user.username,
              action: data.action || lastApplied?.action || 'move',
              data: persistData,
              gameState: snapshot,
              timestamp: new Date(),
            });

            const persist = matchService.addMove(
              room.matchId,
              userId,
              data.action || lastApplied?.action || 'move',
              persistData
            );
            if (room.gameType === 'snake-multiplayer') {
              void persist.catch((error) => console.error('Failed to persist snake turn:', error));
            } else {
              await persist;
            }
          }

          if (room.engine.isGameOver()) {
            const state = room.engine.getGameState();
            await finishMatch(
              gameNs,
              room,
              state.winner,
              state.status === 'draw' ? 'draw' : 'finished'
            );
          } else {
            scheduleBotTurn(gameNs, room);
          }
          return;
        }

        // Fallback for games without an engine instance
        await matchService.addMove(room.matchId, userId, data.action, movePayload);
        gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.MOVE_MADE, {
          playerId: userId,
          username: socket.user.username,
          action: data.action,
          data: movePayload,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to make move' });
      }
    });

    socket.on(SOCKET_EVENTS.GAME.SURRENDER, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      const otherPlayers = Array.from(room.players.keys()).filter(
        (id) => id !== socket.user!._id.toString()
      );

      if (otherPlayers.length >= 1) {
        await finishMatch(gameNs, room, otherPlayers[0], 'surrender');
        return;
      }

      if (JOIN_IN_PROGRESS_GAMES.has(room.gameType)) {
        await finishMatch(gameNs, room, null, 'surrender');
      }
    });

    socket.on(SOCKET_EVENTS.GAME.OFFER_DRAW, (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      room.drawOfferFrom = socket.user._id.toString();
      socket.to(data.roomId).emit(SOCKET_EVENTS.GAME.DRAW_OFFERED, {
        offeredBy: socket.user._id,
        username: socket.user.username,
      });
    });

    socket.on(SOCKET_EVENTS.GAME.ACCEPT_DRAW, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      if (!room.drawOfferFrom || room.drawOfferFrom === socket.user._id.toString()) {
        socket.emit('error', { message: 'No draw offer to accept' });
        return;
      }

      await finishMatch(gameNs, room, null, 'draw');
    });

    socket.on(SOCKET_EVENTS.GAME.SPECTATE, async (data: { roomId: string }) => {
      if (!socket.user) return;
      let room = activeRooms.get(data.roomId);
      if (!room) {
        room = (await hydrateRoomFromDb(data.roomId)) || undefined;
      }
      if (!room) return;

      room.spectators.add(socket.user._id.toString());
      socket.join(data.roomId);

      try {
        const match = await matchService.getMatch(room.matchId);
        socket.emit(SOCKET_EVENTS.GAME.MATCH_FOUND, buildMatchPayload(room, match));
      } catch {
        // ignore
      }

      gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.SPECTATOR_JOINED, {
        userId: socket.user._id,
        username: socket.user.username,
        spectatorCount: room.spectators.size,
      });
    });

    // Friend invite to private room
    socket.on('game:inviteFriend', async (data: { friendId: string; roomId: string; gameType: string }) => {
      try {
        if (!socket.user) return;
        await notificationService.create(
          data.friendId,
          'match_invite',
          'Match Invite',
          `${socket.user.username} invited you to play ${data.gameType}`,
          {
            roomId: data.roomId,
            gameType: data.gameType,
            fromUserId: socket.user._id.toString(),
            fromUsername: socket.user.username,
          }
        );

        gameNs.to(`user:${data.friendId}`).emit(SOCKET_EVENTS.NOTIFICATION.MATCH_INVITE, {
          roomId: data.roomId,
          gameType: data.gameType,
          from: {
            id: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
          },
        });

        socket.emit('game:inviteSent', { friendId: data.friendId, roomId: data.roomId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send invite' });
      }
    });

    socket.on('disconnect', async () => {
      if (!socket.user) return;
      const userId = socket.user._id.toString();

      for (const [, queue] of matchmakingQueue.entries()) {
        queue.delete(userId);
      }

      for (const [roomId, room] of activeRooms.entries()) {
        if (room.players.has(userId)) {
          let matchStatus: string | null = null;
          try {
            const match = await matchService.getMatch(room.matchId);
            matchStatus = match.status;
          } catch {
            matchStatus = null;
          }

          if (matchStatus === 'playing') {
            const player = room.players.get(userId);
            if (player) {
              player.socketId = '';
              player.connected = false;
            }
          } else {
            room.players.delete(userId);
          }

          gameNs.to(roomId).emit(SOCKET_EVENTS.GAME.PLAYER_LEFT, {
            userId,
            username: socket.user.username,
            reason: 'disconnect',
          });

          if (room.players.size === 0) {
            activeRooms.delete(roomId);
          }
        }
        room.spectators.delete(userId);
      }
    });
  });
};

async function handleLeaveRoom(
  gameNs: ReturnType<Server['of']>,
  socket: Socket,
  roomId: string,
  room: GameRoom
): Promise<void> {
  if (!socket.user) return;

  const userId = socket.user._id.toString();
  if (room.engine && !room.engine.isGameOver()) {
    room.engine.eliminatePlayer(userId);
    broadcastEngineState(gameNs, room, userId, 'playerLeft');
    if (room.engine.isGameOver()) {
      const state = room.engine.getGameState();
      await finishMatch(
        gameNs,
        room,
        state.winner,
        state.status === 'draw' ? 'draw' : 'finished'
      );
      return;
    }
  }

  room.players.delete(userId);
  socket.leave(roomId);

  gameNs.to(roomId).emit(SOCKET_EVENTS.GAME.PLAYER_LEFT, {
    userId: socket.user._id,
    username: socket.user.username,
  });

  if (room.players.size === 0) {
    clearRoomTimers(room);
    activeRooms.delete(roomId);
    await matchService.updateMatchStatus(room.matchId, 'aborted');
  }
}
