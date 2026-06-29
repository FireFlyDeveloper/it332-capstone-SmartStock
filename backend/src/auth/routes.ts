/**
 * Auth routes — register, login, logout, me.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-06-29
 */

import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword } from './hash.js';
import { signToken } from './jwt.js';
import { createUser, findByEmail, type Role } from './users.js';
import { requireAuth } from './middleware.js';

export const authRoutes = new Hono();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body: unknown): { ok: true; data: { email: string; name: string; password: string; role: Role } } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid body' };
  const { email, name, password, role } = body as Record<string, unknown>;
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid email' };
  if (typeof name !== 'string' || name.trim().length < 1) return { ok: false, error: 'invalid name' };
  if (typeof password !== 'string' || password.length < 8) return { ok: false, error: 'password must be at least 8 chars' };
  if (role !== 'admin' && role !== 'staff') return { ok: false, error: 'role must be admin or staff' };
  return { ok: true, data: { email, name: name.trim(), password, role } };
}

function validateLogin(body: unknown): { ok: true; data: { email: string; password: string } } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid body' };
  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string') return { ok: false, error: 'invalid body' };
  return { ok: true, data: { email, password } };
}

authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validateRegister(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  if (findByEmail(parsed.data.email)) return c.json({ error: 'email already registered' }, 409);
  const passwordHash = await hashPassword(parsed.data.password);
  const user = createUser({ ...parsed.data, passwordHash });
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  setCookie(c, 'auth_token', token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 201);
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validateLogin(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const user = findByEmail(parsed.data.email);
  if (!user) return c.json({ error: 'invalid credentials' }, 401);
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return c.json({ error: 'invalid credentials' }, 401);
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  setCookie(c, 'auth_token', token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

authRoutes.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, (c) => {
  const user = c.get('user');
  return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});
