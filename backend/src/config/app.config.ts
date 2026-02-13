import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const appConfig = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Next.js frontend directory
  nextDir: process.env.NEXT_DIR || path.join(__dirname, '../../../frontend'),

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'augment_skills',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'localdev123',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Authentication
  auth: {
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'changeme123',
  },

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',

  // Frontend URL (for OAuth redirects)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Google API
  googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json',
  googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY || '',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'console',
    maxSize: parseInt(process.env.LOG_MAX_SIZE || '10485760', 10),
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
  },

  // Feature Flags
  features: {
    googleForms: process.env.ENABLE_GOOGLE_FORMS === 'true',
    csvExport: process.env.ENABLE_CSV_EXPORT === 'true',
    googleSheets: process.env.ENABLE_GOOGLE_SHEETS === 'true',
  },

  // Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'text/csv,application/vnd.ms-excel').split(','),
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '50', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
};

// Validate critical config in production
if (appConfig.nodeEnv === 'production') {
  if (appConfig.sessionSecret === 'your-secret-key-change-this') {
    throw new Error('SESSION_SECRET must be set in production');
  }
  if (appConfig.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
}
