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

const DEFAULTS: AuthConfig = {
  jwtSecret: 'dev-only-secret-change-me',
  jwtExpiresIn: '7d',
  bcryptRounds: 10,
};

export const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || DEFAULTS.jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULTS.jwtExpiresIn,
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS || '', 10) || DEFAULTS.bcryptRounds,
};
