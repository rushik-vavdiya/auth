import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino from 'pino';
import { env } from './config/env.js';
import authRoutes from './modules/auth/routes/auth.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

const app = express();
const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
});

app.disable('x-powered-by');
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return { method: req.method, url: req.url, remoteAddress: req.remoteAddress };
    },
  },
}));
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Authentication API is running' });
});
app.use('/api/v1/auth', authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
