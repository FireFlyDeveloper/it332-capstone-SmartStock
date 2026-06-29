/**
 * In-memory user store — v1 implementation.
 * Will be replaced by Postgres in v2 (see db/auth_schema.sql).
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-06-29
 */

import { randomUUID } from 'node:crypto';

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
  return record;
}

/**
 * Test-only helper — clears the in-memory user store between tests.
 * Exported with a leading underscore to signal "do not import in app code".
 *
 * Author: Hazel
 * Last touched: 2026-06-29
 */
export function _resetUserStore(): void {
  users.clear();
  byEmail.clear();
}
