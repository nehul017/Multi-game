import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../utils/constants';
import { userService } from '../../services/user.service';
import { sessionRepository } from '../../repositories/session.repository';

const onlineUsers = new Map<string, { socketId: string; username: string; avatar: string }>();
const heartbeatTimers = new Map<string, NodeJS.Timeout>();

export const setupPresenceNamespace = (io: Server): void => {
  const presenceNs = io.of('/presence');

  presenceNs.on('connection', async (socket: Socket) => {
    if (!socket.user) return;
    const userId = socket.user._id.toString();

    onlineUsers.set(userId, {
      socketId: socket.id,
      username: socket.user.username,
      avatar: socket.user.avatar,
    });

    await userService.updateOnlineStatus(userId, true);

    await sessionRepository.create({
      userId,
      socketId: socket.id,
      deviceInfo: {
        browser: socket.handshake.headers['user-agent'] || 'unknown',
        os: 'unknown',
        device: 'unknown',
      },
      ipAddress: socket.handshake.address,
      isActive: true,
      lastActivity: new Date(),
    } as any);

    presenceNs.emit(SOCKET_EVENTS.PRESENCE.USER_ONLINE, {
      userId,
      username: socket.user.username,
      avatar: socket.user.avatar,
    });

    socket.emit(SOCKET_EVENTS.PRESENCE.ONLINE_USERS, {
      users: Array.from(onlineUsers.entries()).map(([id, data]) => ({
        userId: id,
        ...data,
      })),
    });

    socket.on(SOCKET_EVENTS.PRESENCE.HEARTBEAT, async () => {
      await sessionRepository.updateActivity(socket.id);

      if (heartbeatTimers.has(userId)) {
        clearTimeout(heartbeatTimers.get(userId)!);
      }

      heartbeatTimers.set(
        userId,
        setTimeout(async () => {
          onlineUsers.delete(userId);
          await userService.updateOnlineStatus(userId, false);
          presenceNs.emit(SOCKET_EVENTS.PRESENCE.USER_OFFLINE, { userId });
        }, 60000)
      );
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);

      if (heartbeatTimers.has(userId)) {
        clearTimeout(heartbeatTimers.get(userId)!);
        heartbeatTimers.delete(userId);
      }

      await userService.updateOnlineStatus(userId, false);
      await sessionRepository.deactivateBySocketId(socket.id);

      presenceNs.emit(SOCKET_EVENTS.PRESENCE.USER_OFFLINE, {
        userId,
        username: socket.user!.username,
      });
    });
  });
};

export const getOnlineUsersCount = (): number => onlineUsers.size;
export const isUserOnline = (userId: string): boolean => onlineUsers.has(userId);
