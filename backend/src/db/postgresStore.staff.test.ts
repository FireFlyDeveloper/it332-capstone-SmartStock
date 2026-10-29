import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listStaffUsersPageDb } from './postgresStore.js';

const user = (id: string, createdAt: string) => ({
  id,
  email: `${id}@example.test`,
  full_name: id,
  password_hash: 'hashed',
  role: 'staff',
  created_at: createdAt,
});

describe('PostgreSQL staff cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('uses parameterized keyset ordering and removes the lookahead row', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 3,
      staff: [user('staff-a', '2026-10-30T09:00:00.123456+00:00'), user('staff-b', '2026-10-30T09:00:00.000000+00:00')],
    }] });

    const result = await listStaffUsersPageDb({
      limit: 1,
      cursorCreatedAt: '2026-10-30T08:00:00.000Z',
      cursorId: 'staff-before',
    });

    expect(result).toMatchObject({
      totalCount: 3,
      hasMore: true,
      nextCursor: { createdAt: '2026-10-30T09:00:00.123456+00:00', id: 'staff-a' },
      users: [{ id: 'staff-a', email: 'staff-a@example.test', createdAt: '2026-10-30T09:00:00.123Z' }],
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('created_at < $1');
    expect(sql).toContain('id::text < $2::text');
    expect(sql).toContain('ORDER BY created_at DESC, id::text DESC');
    expect(sql).toContain('LIMIT $3');
    expect(values).toEqual(['2026-10-30T08:00:00.000Z', 'staff-before', 2]);
  });

  it('returns null when the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    await expect(listStaffUsersPageDb({ limit: 25, cursorCreatedAt: null, cursorId: null })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
