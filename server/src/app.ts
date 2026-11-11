import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttpModule from 'pino-http';
import { loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { createApiRouter } from './routes/index.js';

const pinoHttp = (
  pinoHttpModule as unknown as {
    default: (opts: { logger: typeof logger; customProps: (req: express.Request) => object }) => express.RequestHandler;
  }
).default;

export function createApp(): express.Application {
  const env = loadEnv();
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (req: express.Request) => ({ requestId: req.requestId }),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/api', createApiRouter());

  app.use(errorHandler);

  return app;
}
