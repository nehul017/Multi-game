import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { socketAuthMiddleware } from './middleware/auth';
import { setupChatNamespace } from './namespaces/chat';
import { setupGameNamespace } from './namespaces/game';
import { setupNotificationNamespace } from './namespaces/notification';
import { setupPresenceNamespace } from './namespaces/presence';
import { setupFruitSlotsHandlers } from './namespaces/fruit-slots';
import { env } from '../config/env';

let io: Server;

export const setupSocketIO = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  if (isRedisAvailable()) {
    try {
      const pubClient = getRedisClient().duplicate({ maxRetriesPerRequest: null });
      const subClient = getRedisClient().duplicate({ maxRetriesPerRequest: null });
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter configured');
    } catch (error) {
      console.warn('Redis adapter not available, using default memory adapter');
    }
  } else {
    console.warn('Redis not available, using default memory adapter');
  }

  io.use(socketAuthMiddleware);
  io.of('/chat').use(socketAuthMiddleware);
  io.of('/game').use(socketAuthMiddleware);
  io.of('/notifications').use(socketAuthMiddleware);
  io.of('/presence').use(socketAuthMiddleware);

  setupChatNamespace(io);
  setupGameNamespace(io);
  setupNotificationNamespace(io);
  setupPresenceNamespace(io);
  setupFruitSlotsHandlers(io);

  io.on('connection', (socket) => {
    console.log(`Main: User connected - ${socket.user?.username} (${socket.id})`);

    socket.on('disconnect', (reason) => {
      console.log(`Main: User disconnected - ${socket.user?.username} (${reason})`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
