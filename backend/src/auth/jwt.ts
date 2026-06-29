/**
 * JWT sign/verify — HS256 with shared secret from config.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-06-29
 */

import { sign, verify, type SignOptions } from 'jsonwebtoken';
import { authConfig } from './config.js';

export interface JwtPayload {
  sub: string;          // user id
  email: string;
  role: 'admin' | 'staff';
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: authConfig.jwtExpiresIn as SignOptions['expiresIn'] };
  return sign(payload, authConfig.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, authConfig.jwtSecret);
    if (typeof decoded === 'string') return null;
    const { sub, email, role } = decoded as Record<string, unknown>;
    if (typeof sub !== 'string' || typeof email !== 'string') return null;
    if (role !== 'admin' && role !== 'staff') return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}
