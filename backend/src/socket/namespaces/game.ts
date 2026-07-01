import { Server, Socket } from 'socket.io';
import { matchService } from '../../services/match.service';
import { leaderboardService } from '../../services/leaderboard.service';
import { SOCKET_EVENTS } from '../../utils/constants';

interface GameRoom {
  matchId: string;
  roomId: string;
  players: Map<string, { socketId: string; ready: boolean }>;
  gameState: Record<string, unknown>;
  spectators: Set<string>;
}

const activeRooms = new Map<string, GameRoom>();

export const setupGameNamespace = (io: Server): void => {
  const gameNs = io.of('/game');

  gameNs.on('connection', (socket: Socket) => {
    console.log(`Game: ${socket.user?.username} connected`);

    socket.on(SOCKET_EVENTS.GAME.CREATE_ROOM, async (data: { gameType: string; settings?: Record<string, unknown> }) => {
      try {
        if (!socket.user) return;

        const match = await matchService.createMatch(data.gameType, socket.user._id.toString(), data.settings);
        const roomId = match.roomId;

        const room: GameRoom = {
          matchId: match._id.toString(),
          roomId,
          players: new Map([[socket.user._id.toString(), { socketId: socket.id, ready: false }]]),
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
        const room = activeRooms.get(data.roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        await matchService.joinMatch(room.matchId, socket.user._id.toString());
        room.players.set(socket.user._id.toString(), { socketId: socket.id, ready: false });
        socket.join(data.roomId);

        gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.PLAYER_JOINED, {
          userId: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
          elo: socket.user.elo,
          playersCount: room.players.size,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on(SOCKET_EVENTS.GAME.LEAVE_ROOM, async (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      room.players.delete(socket.user._id.toString());
      socket.leave(data.roomId);

      gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.PLAYER_LEFT, {
        userId: socket.user._id,
        username: socket.user.username,
      });

      if (room.players.size === 0) {
        activeRooms.delete(data.roomId);
        await matchService.updateMatchStatus(room.matchId, 'aborted');
      }
    });

    socket.on(SOCKET_EVENTS.GAME.READY, (data: { roomId: string }) => {
      if (!socket.user) return;
      const room = activeRooms.get(data.roomId);
      if (!room) return;

      const player = room.players.get(socket.user._id.toString());
      if (player) {
        player.ready = true;
      }

      const allReady = Array.from(room.players.values()).every((p) => p.ready);

      if (allReady && room.players.size >= 2) {
        matchService.updateMatchStatus(room.matchId, 'playing');

        let countdown = 3;
        const countdownInterval = setInterval(() => {
          gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.COUNTDOWN, { count: countdown });
          countdown--;
          if (countdown < 0) {
            clearInterval(countdownInterval);
            gameNs.to(data.roomId).emit(SOCKET_EVENTS.GAME.GAME_START, {
              matchId: room.matchId,
              players: Array.from(room.players.keys()),
            });
          }
        }, 1000);
      }
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

    socket.on('disconnect', () => {
      if (!socket.user) return;
      const userId = socket.user._id.toString();

      for (const [roomId, room] of activeRooms.entries()) {
        if (room.players.has(userId)) {
          room.players.delete(userId);
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
