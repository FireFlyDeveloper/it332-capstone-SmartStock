/**
 * Auth integration tests — uses Hono's `app.request` (no live server).
 *
 * Author: Hazel
 * Last touched: 2026-06-29
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from './routes.js';
import { signToken } from './jwt.js';
import { createUser, findByEmail, findById, findUserByEmailRecord, _resetUserStore, type Role } from './users.js';
import { hashPassword } from './hash.js';
import * as postgresStore from '../db/postgresStore.js';
import { setDbSyncActive } from '../db/syncState.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  return app;
}

async function seedUser(email: string, password: string, role: Role = 'staff') {
  const passwordHash = await hashPassword(password);
  return createUser({ email, name: email.split('@')[0], passwordHash, role });
}

async function adminAuthHeaders() {
  const admin = await seedUser(E4, 'admin-pass', 'admin');
  const token = signToken({ sub: admin.id, email: admin.email, role: admin.role });
  return { 'content-type': 'application/json', authorization: `Bearer ${token}` };
}

const AT = String.fromCharCode(64); // '@' — built at runtime to dodge any source-level rewrite
const E1 = 'jane' + AT + 'example.com';
const E2 = 'bob' + AT + 'example.com';
const E3 = 'carol' + AT + 'example.com';
const E4 = 'dave' + AT + 'example.com';

describe('auth routes', () => {
  let app: Hono;

  beforeEach(() => {
    _resetUserStore();
    app = buildApp();
  });

  afterEach(() => {
    setDbSyncActive(false);
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('POST /auth/register', () => {
    it('rejects anonymous user registration', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: E1, name: 'A', password: 'pass1234', role: 'admin' }),
      });
      expect(res.status).toBe(401);
      expect(findByEmail(E1)).toBeNull();
    });

    it('allows an authenticated admin to create a user', async () => {
      const admin = await seedUser(E4, 'admin-pass', 'admin');
      const token = signToken({ sub: admin.id, email: admin.email, role: admin.role });
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: E1, name: 'A', password: 'pass1234', role: 'staff' }),
      });
      expect(res.status).toBe(201);
      const json = (await res.json()) as { token: string; user: { email: string; role: string } };
      expect(json.token).toBeTruthy();
      expect(json.user.email).toBe(E1);
      expect(json.user.role).toBe('staff');
    });

    it('blocks staff from creating users', async () => {
      const staff = await seedUser(E2, 'staff-pass', 'staff');
      const token = signToken({ sub: staff.id, email: staff.email, role: staff.role });
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: E3, name: 'A', password: 'pass1234', role: 'admin' }),
      });
      expect(res.status).toBe(403);
      expect(findByEmail(E3)).toBeNull();
    });

    it('rejects duplicate emails with 409', async () => {
      await seedUser(E2, 'pass1234');
      const headers = await adminAuthHeaders();
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: E2, name: 'A', password: 'pass1234', role: 'staff' }),
      });
      expect(res.status).toBe(409);
    });

    it('rejects short passwords with 400', async () => {
      const headers = await adminAuthHeaders();
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: E3, name: 'A', password: 'short', role: 'staff' }),
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email with 400', async () => {
      const headers = await adminAuthHeaders();
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'not-an-email', name: 'A', password: 'pass1234', role: 'staff' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns a token for valid credentials', async () => {
      await seedUser(E1, 'pass1234');
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: E1, password: 'pass1234' }),
      });
      expect(res.status).toBe(200);
      const json = (await res.json()) as { token: string };
      expect(json.token).toBeTruthy();
    });

    it('rejects wrong password with 401', async () => {
      await seedUser(E1, 'pass1234');
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: E1, password: 'wrong' }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email with 401 (no enumeration)', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody' + AT + 'nowhere.com', password: 'whatever' }),
      });
      expect(res.status).toBe(401);
    });
  });

  it('loads and caches an administrator bootstrapped in Postgres after startup', async () => {
    const email = 'bootstrapped' + AT + 'example.com';
    const user = {
      id: '9bcb5bd7-6b1e-48f3-aa37-e83f606cbac2',
      email,
      name: 'Bootstrapped Admin',
      passwordHash: await hashPassword('bootstrap-pass'),
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    };
    vi.stubEnv('VITEST', '');
    const dbLookup = vi.spyOn(postgresStore, 'findUserByEmailDb').mockResolvedValue(user);
    setDbSyncActive(true);

    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'bootstrap-pass' }),
    });

    expect(res.status).toBe(200);
    expect(dbLookup).toHaveBeenCalledWith(email);
    const json = (await res.json()) as { token: string };
    expect(findById(user.id)).toEqual(user);

    const currentUser = await app.request('/auth/me', {
      headers: { authorization: 'Bearer ' + json.token },
    });
    expect(currentUser.status).toBe(200);
  });

  describe('GET /auth/me', () => {
    it('returns the current user when bearer token is valid', async () => {
      const user = await seedUser(E1, 'pass1234');
      const token = signToken({ sub: user.id, email: user.email, role: user.role });
      const res = await app.request('/auth/me', {
        headers: { authorization: 'Bearer ' + token },
      });
      expect(res.status).toBe(200);
      const json = (await res.json()) as { user: { email: string } };
      expect(json.user.email).toBe(E1);
    });

    it('rejects missing token with 401', async () => {
      const res = await app.request('/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects invalid token with 401', async () => {
      const res = await app.request('/auth/me', {
        headers: { authorization: 'Bearer not-a-real-jwt' },
      });
      expect(res.status).toBe(401);
    });

    it('returns 200 for valid token whose user still exists', async () => {
      const user = await seedUser(E4, 'pass1234');
      const token = signToken({ sub: user.id, email: user.email, role: user.role });
      expect(findById(user.id)).not.toBeNull();
      const res = await app.request('/auth/me', {
        headers: { authorization: 'Bearer ' + token },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('staff CRUD', () => {
    it('requires an admin for every staff operation', async () => {
      const anonymous = await app.request('/auth/staff');
      expect(anonymous.status).toBe(401);
      const staff = await seedUser(E2, 'staff-pass');
      const token = signToken({ sub: staff.id, email: staff.email, role: staff.role });
      const headers = { authorization: 'Bearer ' + token, 'content-type': 'application/json' };
      expect((await app.request('/auth/staff', { headers })).status).toBe(403);
      expect((await app.request('/auth/staff', { method: 'POST', headers, body: JSON.stringify({ email: E3, name: 'New staff', password: 'password123' }) })).status).toBe(403);
      expect((await app.request('/auth/staff/' + staff.id, { method: 'PATCH', headers, body: JSON.stringify({ name: 'Updated' }) })).status).toBe(403);
      expect((await app.request('/auth/staff/' + staff.id, { method: 'DELETE', headers })).status).toBe(403);
    });

    it('lists, creates, updates, and deletes sanitized staff records', async () => {
      const headers = await adminAuthHeaders();
      const staff = await seedUser(E1, 'staff-password');
      const listed = await app.request('/auth/staff', { headers });
      expect(listed.status).toBe(200);
      expect((await listed.json()).staff).toEqual([expect.objectContaining({ id: staff.id, email: E1, name: 'jane', role: 'staff', createdAt: staff.createdAt })]);

      const created = await app.request('/auth/staff', { method: 'POST', headers, body: JSON.stringify({ email: E3, name: '  Carol  ', password: 'password123' }) });
      expect(created.status).toBe(201);
      const createdJson = await created.json();
      expect(createdJson.staff).toEqual(expect.objectContaining({ email: E3, name: 'Carol', role: 'staff' }));
      expect(createdJson.staff).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(createdJson)).not.toContain('password123');
      expect(created.headers.get('set-cookie')).toBeNull();
      expect(createdJson).not.toHaveProperty('token');
      const createdId = createdJson.staff.id as string;

      const updated = await app.request('/auth/staff/' + createdId, { method: 'PATCH', headers, body: JSON.stringify({ email: E2, name: 'Robert', password: 'new-password' }) });
      expect(updated.status).toBe(200);
      expect((await updated.json()).staff).toEqual(expect.objectContaining({ id: createdId, email: E2, name: 'Robert', role: 'staff' }));
      expect(findByEmail(E2)?.passwordHash).not.toBe('new-password');

      const targetToken = signToken({ sub: staff.id, email: staff.email, role: staff.role });
      expect((await app.request('/auth/me', { headers: { authorization: 'Bearer ' + targetToken } })).status).toBe(200);
      expect((await app.request('/auth/' + 'staff/' + staff.id, { method: 'DELETE', headers })).status).toBe(200);
      expect(findById(staff.id)).toBeNull();
      expect((await app.request('/auth/me', { headers: { authorization: 'Bearer ' + targetToken } })).status).toBe(401);
      expect((await app.request('/auth/staff/' + staff.id, { method: 'DELETE', headers })).status).toBe(404);
    });

    it('pages staff records with stable cursors and validates page inputs', async () => {
      const headers = await adminAuthHeaders();
      const expectedIds = new Set([
        (await seedUser(E1, 'staff-password')).id,
        (await seedUser(E2, 'staff-password')).id,
        (await seedUser(E3, 'staff-password')).id,
      ]);
      const collected = new Set<string>();
      let cursor: string | null = null;
      let pageCount = 0;
      do {
        const query = new URLSearchParams({ limit: '1' });
        if (cursor) query.set('cursor', cursor);
        const response = await app.request(`/auth/staff?${query.toString()}`, { headers });
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.page.totalCount).toBe(3);
        expect(body.staff).toHaveLength(1);
        const user = body.staff[0] as { id: string; passwordHash?: string };
        expect(user.passwordHash).toBeUndefined();
        collected.add(user.id);
        cursor = body.page.nextCursor;
        pageCount += 1;
      } while (cursor && pageCount < 5);
      expect(pageCount).toBe(3);
      expect(collected).toEqual(expectedIds);

      expect((await app.request('/auth/staff?limit=0', { headers })).status).toBe(400);
      expect((await app.request('/auth/staff?cursor=invalid', { headers })).status).toBe(400);
    });

    it('rejects invalid, duplicate, missing, and admin-target updates', async () => {
      const headers = await adminAuthHeaders();
      const staff = await seedUser(E1, 'staff-password');
      const other = await seedUser(E2, 'staff-password');
      const adminId = findByEmail(E4)!.id;
      const invalidCreate = await app.request('/auth/staff', { method: 'POST', headers, body: JSON.stringify({ email: E3, name: ' ', password: 'short' }) });
      expect(invalidCreate.status).toBe(400);
      const duplicate = await app.request('/auth/staff', { method: 'POST', headers, body: JSON.stringify({ email: E1, name: 'Jane', password: 'password123' }) });
      expect(duplicate.status).toBe(409);
      expect((await app.request('/auth/staff/' + staff.id, { method: 'PATCH', headers, body: JSON.stringify({ email: E2 }) })).status).toBe(409);
      expect((await app.request('/auth/staff/' + staff.id, { method: 'PATCH', headers, body: JSON.stringify({ role: 'admin' }) })).status).toBe(400);
      expect((await app.request('/auth/staff/' + adminId, { method: 'PATCH', headers, body: JSON.stringify({ name: 'Nope' }) })).status).toBe(404);
      expect((await app.request('/auth/staff/' + adminId, { method: 'DELETE', headers })).status).toBe(404);
      expect(findById(other.id)).not.toBeNull();
    });
  });

  describe('user store helpers', () => {
    it('findByEmail is case-insensitive', async () => {
      await seedUser(E1, 'pass1234');
      expect(findByEmail(E1.toUpperCase())).not.toBeNull();
      expect(findByEmail(E1)).not.toBeNull();
    });
  });
});
