import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('DATABASE_URL', '');

const { app } = await import('../index.js');

describe('database health route', () => {
  it('reports unavailable when DATABASE_URL is missing', async () => {
    const res = await app.request('/health/db');

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ mode: 'unavailable', ok: false });
  });
});
