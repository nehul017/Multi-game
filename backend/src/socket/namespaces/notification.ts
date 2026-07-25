import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../utils/constants';
import { gameEvents, EVENTS } from '../../events';
import { notificationRepository } from '../../repositories/notification.repository';
import { settingsRepository } from '../../repositories/settings.repository';
import { SETTING_DEFINITIONS } from '../../utils/settings.constants';

const userSockets = new Map<string, Set<string>>();

async function getPlatformStatusPayload(): Promise<{ maintenanceMode: boolean }> {
  const maintenance = await settingsRepository.getByKey('maintenance_mode');
  return {
    maintenanceMode: Boolean(
      maintenance?.value ?? SETTING_DEFINITIONS.maintenanceMode.defaultValue
    ),
  };
}

export const setupNotificationNamespace = (io: Server): void => {
  const notifNs = io.of('/notifications');

  notifNs.on('connection', (socket: Socket) => {
    if (!socket.user) return;
    const userId = socket.user._id.toString();

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);

    console.log(`Notifications: ${socket.user.username} subscribed`);

    const sendUnreadCount = () => {
      void notificationRepository
        .getUnreadCount(userId)
        .then((count) => {
          socket.emit(SOCKET_EVENTS.NOTIFICATION.UNREAD_COUNT, { count });
        })
        .catch(() => {
          // Ignore count sync failures
        });
    };

    const sendPlatformStatus = () => {
      void getPlatformStatusPayload()
        .then((status) => {
          socket.emit(SOCKET_EVENTS.PLATFORM.STATUS, status);
        })
        .catch(() => {
          // Ignore status sync failures
        });
    };

    sendUnreadCount();
    sendPlatformStatus();
    socket.on(SOCKET_EVENTS.NOTIFICATION.SUBSCRIBE, sendUnreadCount);
    socket.on(SOCKET_EVENTS.PLATFORM.SUBSCRIBE, sendPlatformStatus);

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  gameEvents.on(EVENTS.FRIEND_REQUEST_SENT, ({ from, to }) => {
    notifNs.to(`user:${to}`).emit(SOCKET_EVENTS.NOTIFICATION.FRIEND_REQUEST, {
      from,
      timestamp: new Date(),
    });
  });

  gameEvents.on(EVENTS.MATCH_CREATED, ({ matchId, gameType }) => {
    notifNs.emit(SOCKET_EVENTS.NOTIFICATION.MATCH_INVITE, {
      matchId,
      gameType,
      timestamp: new Date(),
    });
  });

  gameEvents.on(EVENTS.TOURNAMENT_STARTED, ({ tournamentId }) => {
    notifNs.emit(SOCKET_EVENTS.NOTIFICATION.TOURNAMENT_UPDATE, {
      tournamentId,
      status: 'started',
      timestamp: new Date(),
    });
  });

  gameEvents.on(EVENTS.TOURNAMENT_ENDED, ({ tournamentId, winner }) => {
    notifNs.emit(SOCKET_EVENTS.NOTIFICATION.TOURNAMENT_UPDATE, {
      tournamentId,
      status: 'ended',
      winner,
      timestamp: new Date(),
    });
  });

  gameEvents.on(EVENTS.ACHIEVEMENT_UNLOCKED, ({ userId, achievementId }) => {
    notifNs.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION.ACHIEVEMENT_UNLOCKED, {
      achievementId,
      timestamp: new Date(),
    });
  });
};

export const emitToUser = (io: Server, userId: string, event: string, data: unknown): void => {
  io.of('/notifications').to(`user:${userId}`).emit(event, data);
};

export const broadcastPlatformStatus = (
  io: Server,
  status: { maintenanceMode: boolean }
): void => {
  io.of('/notifications').emit(SOCKET_EVENTS.PLATFORM.STATUS, status);
};
