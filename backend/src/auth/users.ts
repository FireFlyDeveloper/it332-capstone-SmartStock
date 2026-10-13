/**
 * In-memory user store — v1 implementation.
 * Will be replaced by Postgres in v2 (see db/auth_schema.sql).
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-06-29
 */

import { randomUUID } from 'node:crypto';
import { isDbSyncActive } from '../db/syncState.js';
import { createUserDb, updateUserDb } from '../db/postgresStore.js';

export type Role = 'admin' | 'staff';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

const users = new Map<string, UserRecord>();      // by id
const byEmail = new Map<string, string>();       // email -> id

export function findByEmail(email: string): UserRecord | null {
  const id = byEmail.get(email.toLowerCase());
  return id ? users.get(id) ?? null : null;
}

export function findById(id: string): UserRecord | null {
  return users.get(id) ?? null;
}

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}): UserRecord {
  const email = input.email.toLowerCase();
  if (byEmail.has(email)) {
    throw new Error('email already registered');
  }
  const record: UserRecord = {
    id: randomUUID(),
    email,
    name: input.name,
    passwordHash: input.passwordHash,
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  users.set(record.id, record);
  byEmail.set(record.email, record.id);
  if (isDbSyncActive()) {
    createUserDb(input).catch((err) => {
      console.error('[auth/users] DB write error on createUser:', err);
    });
  }
  return record;
}

export function updateUser(id: string, updates: { name?: string; passwordHash?: string }): UserRecord | null {
  const user = users.get(id);
  if (!user) return null;
  if (updates.name !== undefined) user.name = updates.name.trim();
  if (updates.passwordHash !== undefined) user.passwordHash = updates.passwordHash;
  if (isDbSyncActive()) {
    updateUserDb(id, updates).catch((err) => {
      console.error('[auth/users] DB write error on updateUser:', err);
    });
  }
  return user;
}

/**
 * Test-only helper — clears the in-memory user store between tests.
 * Exported with a leading underscore to signal "do not import in app code".
 *
 * Author: Hazel
 * Last touched: 2026-06-29
 */
export function _hydrateUsers(loaded: UserRecord[]): void {
  users.clear();
  byEmail.clear();
  for (const item of loaded) {
    users.set(item.id, item);
    byEmail.set(item.email.toLowerCase(), item.id);
  }
}

export function _resetUserStore(): void {
  users.clear();
  byEmail.clear();
}
