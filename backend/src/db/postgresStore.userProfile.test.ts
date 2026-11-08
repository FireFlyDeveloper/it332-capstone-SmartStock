import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { updateOwnUserProfileDb } from './postgresStore.js';

const adminRow = (email: string, name: string) => ({
  id: 'admin-id',
  email,
  full_name: name,
  password_hash: 'hashed-password',
  role: 'admin',
  created_at: '2026-01-02T03:04:05.000Z',
});

describe('PostgreSQL own-profile update', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('updates only the requested profile fields and preserves username', async () => {
    database.query.mockResolvedValueOnce({ rows: [adminRow('new-admin@example.test', 'Updated Admin')] });

    const updated = await updateOwnUserProfileDb('admin-id', {
      email: 'new-admin@example.test',
      name: 'Updated Admin',
    });

    expect(updated).toMatchObject({
      id: 'admin-id',
      email: 'new-admin@example.test',
      name: 'Updated Admin',
      role: 'admin',
    });
    const [updateSql, updateValues] = database.query.mock.calls[0] as [string, unknown[]];
    expect(updateSql).toContain('UPDATE users SET email = COALESCE($2, email), full_name = COALESCE($3, full_name)');
    expect(updateSql).toContain('WHERE id = $1 AND deleted_at IS NULL');
    expect(updateSql).not.toContain('username =');
    expect(updateSql).not.toContain("role = 'staff'");
    expect(updateValues).toEqual(['admin-id', 'new-admin@example.test', 'Updated Admin']);
  });
});
