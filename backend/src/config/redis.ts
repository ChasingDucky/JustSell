import { createClient } from 'redis';
import { config } from './index';
import logger from '../utils/logger';

export const redisClient = createClient({
  url: config.redis.url || `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password,
  database: config.redis.db,
});

redisClient.on('error', (error) => {
  logger.error('Redis Client Error:', error);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

export default redisClient;
