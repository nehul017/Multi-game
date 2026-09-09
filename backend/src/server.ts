import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { setupSocketIO } from './socket';
import { ensureMindiCatalog } from './jobs/ensure-mindi';
import { ensureJigsawWorldCatalog } from './jobs/ensure-jigsaw-world';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    console.log('Database connected');
    try {
      await ensureMindiCatalog();
    } catch (error) {
      console.warn('Mindi catalog ensure failed:', error);
    }
    try {
      await ensureJigsawWorldCatalog();
    } catch (error) {
      console.warn('Jigsaw World catalog ensure failed:', error);
    }

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
      const lines = [
        'MultiGame Platform Backend',
        `Running on port ${env.port}`,
        `Environment: ${env.nodeEnv}`,
        `API Docs: http://localhost:${env.port}/api-docs`,
      ];
      const innerWidth = Math.max(...lines.map((l) => l.length)) + 6;
      const top = `╔${'═'.repeat(innerWidth)}╗`;
      const bottom = `╚${'═'.repeat(innerWidth)}╝`;
      const body = lines
        .map((l) => `║   ${l.padEnd(innerWidth - 3)}║`)
        .join('\n');
      console.log(`\n${top}\n${body}\n${bottom}\n`);
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
      // Open sockets can block close() forever and leave port 5000 dead.
      setTimeout(() => process.exit(0), 1500).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
