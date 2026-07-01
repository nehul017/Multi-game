import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '@config/(.*)': '<rootDir>/src/config/$1',
    '@models/(.*)': '<rootDir>/src/models/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@repositories/(.*)': '<rootDir>/src/repositories/$1',
    '@routes/(.*)': '<rootDir>/src/routes/$1',
    '@middleware/(.*)': '<rootDir>/src/middleware/$1',
    '@socket/(.*)': '<rootDir>/src/socket/$1',
    '@games/(.*)': '<rootDir>/src/games/$1',
    '@validators/(.*)': '<rootDir>/src/validators/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@interfaces/(.*)': '<rootDir>/src/interfaces/$1',
    '@types/(.*)': '<rootDir>/src/types/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**',
    '!src/interfaces/**',
    '!src/server.ts',
    '!src/jobs/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  setupFilesAfterEnv: [],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;
