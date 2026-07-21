import { Server, Socket } from 'socket.io';
import { matchService } from '../../services/match.service';
import { leaderboardService } from '../../services/leaderboard.service';
import { SOCKET_EVENTS } from '../../utils/constants';

interface GameRoom {
  matchId: string;
  roomId: string;
  gameType: string;
  players: Map<string, { socketId: string; ready: boolean; connected: boolean }>;
  gameState: Record<string, unknown>;
  spectators: Set<string>;
}

const activeRooms = new Map<string, GameRoom>();
const matchmakingQueue = new Map<string, Set<string>>();

const toPlayerId = (userId: unknown): string => {
  if (userId == null) return '';
  if (typeof userId === 'object' && userId !== null && '_id' in userId) {
    return String((userId as { _id: unknown })._id);
  }
  return String(userId);
};

const hydrateRoomFromDb = async (roomId: string): Promise<GameRoom | null> => {
  const existing = activeRooms.get(roomId);
  if (existing) return existing;

  const match = await matchService.getMatchByRoom(roomId);
  if (!['waiting', 'playing'].includes(match.status)) return null;

  const room: GameRoom = {
    matchId: match._id.toString(),
    roomId: match.roomId,
    gameType: match.gameType,
    players: new Map(),
    gameState: {},
    spectators: new Set(match.spectators?.map((id) => toPlayerId(id)) || []),
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

  return {
    roomId: room.roomId,
    matchId: room.matchId,
    gameType: room.gameType,
    status: match.status,
    players,
    moves: match.moves,
    gameState: room.gameState,
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

const startGameCountdown = (gameNs: ReturnType<Server['of']>, room: GameRoom): void => {
  let countdown = 3;
  const countdownInterval = setInterval(() => {
    gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.COUNTDOWN, { count: countdown });
    countdown--;
    if (countdown < 0) {
      clearInterval(countdownInterval);
      gameNs.to(room.roomId).emit(SOCKET_EVENTS.GAME.GAME_START, {
        matchId: room.matchId,
        players: Array.from(room.players.keys()),
      });
    }
  }, 1000);
};

const tryStartGame = async (gameNs: ReturnType<Server['of']>, room: GameRoom): Promise<void> => {
  const allReady = Array.from(room.players.values()).every((p) => p.ready);
  if (allReady && room.players.size >= 2) {
    await matchService.updateMatchStatus(room.matchId, 'playing');
    startGameCountdown(gameNs, room);
  }
};

export const setupGameNamespace = (io: Server): void => {
  const gameNs = io.of('/game');

  gameNs.on('connection', (socket: Socket) => {
    console.log(`Game: ${socket.user?.username} connected`);

    socket.on(SOCKET_EVENTS.GAME.MATCHMAKING, async (data: { gameSlug: string }) => {
      try {
        if (!socket.user) return;

        const gameType = data.gameSlug;
        const userId = socket.user._id.toString();

        if (!matchmakingQueue.has(gameType)) {
          matchmakingQueue.set(gameType, new Set());
        }
        const queue = matchmakingQueue.get(gameType)!;

        for (const [roomId, room] of activeRooms.entries()) {
          if (room.gameType !== gameType || room.players.size !== 1 || room.players.has(userId)) {
            continue;
          }

          const existingMatch = await matchService.getMatch(room.matchId);
          if (existingMatch.status !== 'waiting') {
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

          await tryStartGame(gameNs, room);
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

        const match = await matchService.createMatch(gameType, userId);
        const roomId = match.roomId;

        const room: GameRoom = {
          matchId: match._id.toString(),
          roomId,
          gameType,
          players: new Map([[userId, { socketId: socket.id, ready: false, connected: true }]]),
          gameState: {},
          spectators: new Set(),
        };

        activeRooms.set(roomId, room);
        socket.join(roomId);

        socket.emit(SOCKET_EVENTS.GAME.ROOM_CREATED, {
          roomId,
          matchId: match._id,
          gameType,
        });
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

        const room: GameRoom = {
          matchId: match._id.toString(),
          roomId,
          gameType: data.gameType,
          players: new Map([[socket.user._id.toString(), { socketId: socket.id, ready: false, connected: true }]]),
          gameState: {},
          spectators: new Set(),
        };

        activeRooms.set(roomId, room);
        socket.join(roomId);

        socket.emit(SOCKET_EVENTS.GAME.ROOM_CREATED, {
          roomId,
          matchId: match._id,
          gameType: data.gameType,
        });
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
          room.players.set(userId, { socketId: socket.id, ready: false, connected: true });
        }

        socket.join(data.roomId);
        emitRoomState(socket, room, match, isExistingPlayer);

        if (!isExistingPlayer) {
          gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.PLAYER_JOINED, {
            userId: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
            elo: socket.user.elo,
            playersCount: room.players.size,
          });
        } else {
          gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.PLAYER_JOINED, {
            userId: socket.user._id,
            username: socket.user.username,
            avatar: socket.user.avatar,
            elo: socket.user.elo,
            playersCount: room.players.size,
            reconnected: true,
          });
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

    socket.on(SOCKET_EVENTS.GAME.MAKE_MOVE, async (data: { roomId: string; action: string; moveData: Record<string, unknown> }) => {
      try {
        if (!socket.user) return;
        const room = activeRooms.get(data.roomId);
        if (!room) return;

        await matchService.addMove(room.matchId, socket.user._id.toString(), data.action, data.moveData);

        gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.MOVE_MADE, {
          playerId: socket.user._id,
          username: socket.user.username,
          action: data.action,
          data: data.moveData,
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

      if (otherPlayers.length === 1) {
        const winnerId = otherPlayers[0];
        await matchService.setWinner(room.matchId, winnerId);

        await leaderboardService.updateLeaderboard(winnerId, 'general', 'win', socket.user.elo);
        await leaderboardService.updateLeaderboard(socket.user._id.toString(), 'general', 'loss', socket.user.elo);

        gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.GAME_OVER, {
          winner: winnerId,
          reason: 'surrender',
          surrenderedBy: socket.user._id,
        });

        activeRooms.delete(data.roomId);
      }
    });

    socket.on(SOCKET_EVENTS.GAME.OFFER_DRAW, (data: { roomId: string }) => {
      if (!socket.user) return;
      socket.to(data.roomId).emit(SOCKET_EVENTS.GAME.DRAW_OFFERED, {
        offeredBy: socket.user._id,
        username: socket.user.username,
      });
    });

    socket.on(SOCKET_EVENTS.GAME.ACCEPT_DRAW, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      await matchService.setDraw(room.matchId);

      for (const playerId of room.players.keys()) {
        await leaderboardService.updateLeaderboard(playerId, 'general', 'draw', 1000);
      }

      gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.GAME_OVER, {
        winner: null,
        reason: 'draw',
        acceptedBy: socket.user._id,
      });

      activeRooms.delete(data.roomId);
    });

    socket.on(SOCKET_EVENTS.GAME.SPECTATE, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      room.spectators.add(socket.user._id.toString());
      socket.join(data.roomId);

      gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.SPECTATOR_JOINED, {
        userId: socket.user._id,
        username: socket.user.username,
        spectatorCount: room.spectators.size,
      });
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

  room.players.delete(socket.user._id.toString());
  socket.leave(roomId);

  gameNs.to(roomId).emit(SOCKET_EVENTS.GAME.PLAYER_LEFT, {
    userId: socket.user._id,
    username: socket.user.username,
  });

  if (room.players.size === 0) {
    activeRooms.delete(roomId);
    await matchService.updateMatchStatus(room.matchId, 'aborted');
  }
}
