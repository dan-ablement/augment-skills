describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('default values', () => {
    it('should use default port 3001', async () => {
      delete process.env.PORT;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.port).toBe(3001);
    });

    it('should use default nodeEnv as development', async () => {
      delete process.env.NODE_ENV;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.nodeEnv).toBe('development');
    });

    it('should use default apiPrefix', async () => {
      delete process.env.API_PREFIX;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.apiPrefix).toBe('/api/v1');
    });

    it('should use default database configuration', async () => {
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.database.host).toBe('localhost');
      expect(appConfig.database.port).toBe(5432);
      expect(appConfig.database.name).toBe('augment_skills');
      expect(appConfig.database.user).toBe('postgres');
      expect(appConfig.database.password).toBe('localdev123');
    });

    it('should use default redis configuration', async () => {
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.redis.host).toBe('localhost');
      expect(appConfig.redis.port).toBe(6379);
      expect(appConfig.redis.password).toBeUndefined();
    });
  });

  describe('environment variable parsing', () => {
    it('should parse PORT as number', async () => {
      process.env.PORT = '4000';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.port).toBe(4000);
      expect(typeof appConfig.port).toBe('number');
    });

    it('should parse DB_PORT as number', async () => {
      process.env.DB_PORT = '5433';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.database.port).toBe(5433);
      expect(typeof appConfig.database.port).toBe('number');
    });

    it('should parse REDIS_PORT as number', async () => {
      process.env.REDIS_PORT = '6380';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.redis.port).toBe(6380);
      expect(typeof appConfig.redis.port).toBe('number');
    });

    it('should parse boolean CORS_CREDENTIALS as true', async () => {
      process.env.CORS_CREDENTIALS = 'true';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.corsCredentials).toBe(true);
    });

    it('should parse boolean CORS_CREDENTIALS as false when not "true"', async () => {
      process.env.CORS_CREDENTIALS = 'false';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.corsCredentials).toBe(false);
    });

    it('should parse feature flags as booleans', async () => {
      process.env.ENABLE_GOOGLE_FORMS = 'true';
      process.env.ENABLE_CSV_EXPORT = 'true';
      process.env.ENABLE_GOOGLE_SHEETS = 'false';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.features.googleForms).toBe(true);
      expect(appConfig.features.csvExport).toBe(true);
      expect(appConfig.features.googleSheets).toBe(false);
    });

    it('should parse ALLOWED_FILE_TYPES as array', async () => {
      process.env.ALLOWED_FILE_TYPES = 'text/csv,application/json,text/plain';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.upload.allowedFileTypes).toEqual([
        'text/csv',
        'application/json',
        'text/plain',
      ]);
    });
  });

  describe('pagination configuration', () => {
    it('should use default pagination values', async () => {
      delete process.env.DEFAULT_PAGE_SIZE;
      delete process.env.MAX_PAGE_SIZE;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.pagination.defaultPageSize).toBe(50);
      expect(appConfig.pagination.maxPageSize).toBe(100);
    });

    it('should parse custom pagination values', async () => {
      process.env.DEFAULT_PAGE_SIZE = '25';
      process.env.MAX_PAGE_SIZE = '200';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.pagination.defaultPageSize).toBe(25);
      expect(appConfig.pagination.maxPageSize).toBe(200);
    });
  });

  describe('session configuration', () => {
    it('should use default session maxAge (24 hours)', async () => {
      delete process.env.SESSION_MAX_AGE;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.sessionMaxAge).toBe(86400000);
    });

    it('should parse custom session maxAge', async () => {
      process.env.SESSION_MAX_AGE = '3600000';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.sessionMaxAge).toBe(3600000);
    });

    it('should parse custom session secret', async () => {
      process.env.SESSION_SECRET = 'custom-secret-key-for-testing';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.sessionSecret).toBe('custom-secret-key-for-testing');
    });
  });

  describe('port configuration', () => {
    it('should use PORT from environment variable', async () => {
      process.env.PORT = '8080';
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.port).toBe(8080);
    });

    it('should default to 3001 when PORT is not set', async () => {
      delete process.env.PORT;
      const { appConfig } = await import('../../config/app.config');
      expect(appConfig.port).toBe(3001);
    });
  });
});

