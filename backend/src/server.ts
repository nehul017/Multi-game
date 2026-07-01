import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { setupSocketIO } from './socket';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log('Database connected');

    const redisConnected = await connectRedis();
    if (redisConnected) {
      console.log('Redis client initialized');
    } else {
      console.warn('Redis connection failed, continuing without Redis');
    }

    const httpServer = http.createServer(app);

    const io = setupSocketIO(httpServer);
    console.log('Socket.IO initialized');

    httpServer.listen(env.port, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║       MultiGame Platform Backend              ║
║       Running on port ${env.port}                   ║
║       Environment: ${env.nodeEnv.padEnd(25)}║
║       API Docs: http://localhost:${env.port}/api-docs ║
╚═══════════════════════════════════════════════╝
      `);
    });

    process.on('unhandledRejection', (err: Error) => {
      console.error('UNHANDLED REJECTION:', err.message);
      httpServer.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('UNCAUGHT EXCEPTION:', err.message);
      httpServer.close(() => process.exit(1));
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
