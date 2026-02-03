import { Pool, PoolConfig } from 'pg';
import { appConfig } from './app.config';
import { logger } from './logger.config';

const poolConfig: PoolConfig = {
  host: appConfig.database.host,
  port: appConfig.database.port,
  database: appConfig.database.name,
  user: appConfig.database.user,
  password: appConfig.database.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

export const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
};

// Helper function to get a client from the pool (for transactions)
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args: any[]) => {
    // @ts-ignore
    client.lastQuery = args;
    // @ts-ignore
    return query(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    // @ts-ignore
    client.query = query;
    client.release = release;
    return release();
  };

  return client;
};

export default pool;

