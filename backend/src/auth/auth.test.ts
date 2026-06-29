/**
 * Auth integration tests — uses Hono's `app.request` (no live server).
 *
 * Author: Hazel
 * Last touched: 2026-06-29
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from './routes.js';
import { signToken } from './jwt.js';
import { createUser, findByEmail, findById, _resetUserStore, type Role } from './users.js';
import { hashPassword } from './hash.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  return app;
}

async function seedUser(email: string, password: string, role: Role = 'staff') {
  const passwordHash = await hashPassword(password);
  return createUser({ email, name: email.split('@')[0], passwordHash, role });
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

  describe('POST /auth/register', () => {
    it('creates a new user and returns a token', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: E1, name: 'A', password: 'pass1234', role: 'staff' }),
      });
      expect(res.status).toBe(201);
      const json = (await res.json()) as { token: string; user: { email: string; role: string } };
      expect(json.token).toBeTruthy();
      expect(json.user.email).toBe(E1);
      expect(json.user.role).toBe('staff');
    });

    it('rejects duplicate emails with 409', async () => {
      await seedUser(E2, 'pass1234');
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: E2, name: 'A', password: 'pass1234', role: 'staff' }),
      });
      expect(res.status).toBe(409);
    });

    it('rejects short passwords with 400', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: E3, name: 'A', password: 'short', role: 'staff' }),
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email with 400', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
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

  describe('user store helpers', () => {
    it('findByEmail is case-insensitive', async () => {
      await seedUser(E1, 'pass1234');
      expect(findByEmail(E1.toUpperCase())).not.toBeNull();
      expect(findByEmail(E1)).not.toBeNull();
    });
  });
});
