import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { bootstrapInitialAdmin } from './bootstrapInitialAdmin.js';

function poolWithExistingAdmins(adminIds: string[] = []) {
  const statements: Array<{ sql: string; values?: unknown[] }> = [];
  const client = {
    query: vi.fn(async (sql: string, values?: unknown[]) => {
      statements.push({ sql, values });
      if (sql.includes('SELECT id FROM users')) {
        return { rows: adminIds.map((id) => ({ id })) };
      }
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, 'connect'>;
  return { pool, client, statements };
}

describe('bootstrapInitialAdmin', () => {
  it('creates the first admin inside a transaction and releases the client', async () => {
    const { pool, client, statements } = poolWithExistingAdmins();

    const result = await bootstrapInitialAdmin(pool, {
      email: 'Owner@Example.com',
      name: 'Store Owner',
      passwordHash: 'bcrypt-hash',
    });

    if (!result.created) throw new Error('Expected the initial admin to be created.');
    expect(result.id).toBeTruthy();
    expect(statements.map(({ sql }) => sql.trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'SELECT', 'SELECT', 'INSERT', 'COMMIT',
    ]);
    const insert = statements.find(({ sql }) => sql.includes('INSERT INTO users'));
    expect(insert?.values).toEqual([
      result.id,
      expect.stringMatching(/^bootstrap-/),
      'owner@example.com',
      'Store Owner',
      'bcrypt-hash',
    ]);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('does not create another admin when an active admin already exists', async () => {
    const { pool, client, statements } = poolWithExistingAdmins(['admin-id']);

    const result = await bootstrapInitialAdmin(pool, {
      email: 'owner@example.com',
      name: 'Store Owner',
      passwordHash: 'bcrypt-hash',
    });

    expect(result).toEqual({ created: false });
    expect(statements.some(({ sql }) => sql.includes('INSERT INTO users'))).toBe(false);
    expect(statements.at(-1)?.sql).toBe('ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rolls back and rethrows database errors', async () => {
    const { pool, client, statements } = poolWithExistingAdmins();
    client.query.mockImplementation(async (sql: string, values?: unknown[]) => {
      statements.push({ sql, values });
      if (sql.includes('SELECT id FROM users')) {
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO users')) throw new Error('insert failed');
      return { rows: [] };
    });

    await expect(bootstrapInitialAdmin(pool, {
      email: 'owner@example.com',
      name: 'Store Owner',
      passwordHash: 'bcrypt-hash',
    })).rejects.toThrow('insert failed');

    expect(statements.at(-1)?.sql).toBe('ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });
});
