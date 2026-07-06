import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import env from './config/env.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimit } from './middleware/rateLimit.middleware.js';
import logger from './utils/logger.js';

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(apiRateLimit);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/gmail', gmailRoutes);
app.use('/ai', aiRoutes);
app.use('/chat', chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    logger.info(`Backend listening on http://localhost:${env.PORT}`);
  });
}

export default app;
