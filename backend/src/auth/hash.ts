/**
 * Password hashing — bcrypt wrapper.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-06-29
 */

import bcrypt from 'bcryptjs';
import { authConfig } from './config.js';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, authConfig.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
