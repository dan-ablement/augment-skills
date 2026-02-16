import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import RedisStore from 'connect-redis';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import dotenv from 'dotenv';
import next from 'next';

import { appConfig } from './config/app.config';
import { redisClient } from './config/redis.config';
import { logger } from './config/logger.config';
import { errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import employeeSkillsRoutes from './routes/employee-skills.routes';
import skillRoutes from './routes/skill.routes';
import dashboardRoutes from './routes/dashboard.routes';
import importRoutes from './routes/import.routes';
import validationEventsRoutes from './routes/validation-events.routes';
import viewsRoutes from './routes/views.routes';
import settingsRoutes from './routes/settings.routes';
import exportRoutes from './routes/export.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = appConfig.port;
const dev = appConfig.nodeEnv !== 'production';

// Next.js app instance
const nextApp = next({ dev, dir: appConfig.nextDir });
const nextHandler = nextApp.getRequestHandler();

// ============================================
// MIDDLEWARE
// ============================================

// Security — disable CSP so Next.js inline scripts are not blocked
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — only needed in development when frontend/backend run on different ports
if (dev) {
  app.use(cors({
    origin: appConfig.corsOrigin,
    credentials: appConfig.corsCredentials,
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Trust proxy for Cloud Run (required for secure cookies behind load balancer)
app.set('trust proxy', 1);

// Session management with Redis
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: appConfig.sessionSecret,
    name: 'augment.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: appConfig.nodeEnv === 'production',
      httpOnly: true,
      maxAge: appConfig.sessionMaxAge,
      sameSite: 'lax',
    },
  })
);

// Initialize Passport (for OAuth)
app.use(passport.initialize());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const API_PREFIX = appConfig.apiPrefix;
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/employees`, employeeSkillsRoutes);
app.use(`${API_PREFIX}/skills`, skillRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/import`, importRoutes);
app.use(`${API_PREFIX}/validation-events`, validationEventsRoutes);
app.use(`${API_PREFIX}/views`, viewsRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/export`, exportRoutes);

// Error handler for API routes
app.use(errorHandler);

// Next.js catch-all handler — serves pages, static assets, _next/*
app.all('*', (req, res) => {
  return nextHandler(req, res);
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connected');

    // Prepare Next.js
    await nextApp.prepare();
    logger.info('✅ Next.js ready');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${appConfig.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
      logger.info(`🌐 Frontend: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
});

startServer();

export default app;

