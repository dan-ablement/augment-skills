import { createClient } from 'redis';
import { appConfig } from './app.config';
import { logger } from './logger.config';

// Create Redis client
export const redisClient = createClient({
  socket: {
    host: appConfig.redis.host,
    port: appConfig.redis.port,
  },
  password: appConfig.redis.password,
});

// Error handling
redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis client ready');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
})();

export default redisClient;

