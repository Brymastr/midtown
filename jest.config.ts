import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['<rootDir>/**/*.test.ts'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist'],
  passWithNoTests: true,
};

export default config;
