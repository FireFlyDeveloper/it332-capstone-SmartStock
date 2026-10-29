import '../config/env.js';

/**
 * Auth configuration — environment variables with safe defaults.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-06-29
 */

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

const TEST_SECRET = 'smartstock-test-only-secret-at-least-32-characters';
const DEFAULTS: AuthConfig = {
  jwtSecret: TEST_SECRET,
  jwtExpiresIn: '7d',
  bcryptRounds: 10,
};

export const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET?.trim() || (process.env.VITEST ? DEFAULTS.jwtSecret : ''),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULTS.jwtExpiresIn,
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS || '', 10) || DEFAULTS.bcryptRounds,
};

export function assertAuthConfig(): void {
  if (authConfig.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
}
