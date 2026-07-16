import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('DATABASE_URL', '');

const { app } = await import('../index.js');

describe('database health route', () => {
  it('reports memory mode when DATABASE_URL is missing', async () => {
    const res = await app.request('/health/db');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ mode: 'memory', ok: true });
  });
});
