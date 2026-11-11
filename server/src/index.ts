import mongoose from 'mongoose';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';

const env = loadEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server listening');
});

async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');
}

void connectDatabase().catch((err: unknown) => {
  logger.fatal({ err }, 'MongoDB connection failed');
  process.exit(1);
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    void mongoose.connection.close(false).then(() => {
      process.exit(0);
    });
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };
