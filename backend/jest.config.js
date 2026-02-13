/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      // Suppress TS2704 (delete on readonly property) caused by Next.js global
      // type augmentations making process.env.NODE_ENV readonly.
      // Type checking is handled by `npx tsc --noEmit` separately.
      diagnostics: false,
    }],
  },
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/**/__tests__/**',
    // Exclude routes (require integration tests with database)
    '!src/routes/**',
    // Exclude config files that require external services
    '!src/config/database.config.ts',
    '!src/config/redis.config.ts',
    '!src/config/oauth.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};

