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
import { createUserRecord, findByEmail, findById, findUserByEmailRecord, updateUserRecord, listStaffUserRecords, deleteStaffUserRecord, type Role, type UserRecord } from './users.js';
import { requireAuth, requireRole } from './middleware.js';

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

authRoutes.post('/register', requireAuth, requireRole('admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validateRegister(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  if (findByEmail(parsed.data.email)) return c.json({ error: 'email already registered' }, 409);
  const passwordHash = await hashPassword(parsed.data.password);
  let user;
  try {
    user = await createUserRecord({ ...parsed.data, passwordHash });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return c.json({ error: 'email already registered' }, 409);
    }
    console.error('[auth] user creation could not be saved:', error);
    return c.json({ error: 'user creation could not be saved' }, 503);
  }
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  setCookie(c, 'auth_token', token, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return c.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }, 201);
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validateLogin(body);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  let user;
  try {
    user = await findUserByEmailRecord(parsed.data.email);
  } catch {
    console.error('[auth] user lookup failed');
    return c.json({ error: 'authentication unavailable' }, 503);
  }
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

authRoutes.patch('/profile', requireAuth, async (c) => {
  const authUser = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object') return c.json({ error: 'invalid body' }, 400);
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  if (name !== undefined && name.length === 0) return c.json({ error: 'name cannot be empty' }, 400);
  let updated;
  try {
    updated = await updateUserRecord(authUser.id, { name });
  } catch (error) {
    console.error('[auth] profile update could not be saved:', error);
    return c.json({ error: 'profile update could not be saved' }, 503);
  }
  if (!updated) return c.json({ error: 'user not found' }, 404);
  return c.json({ ok: true, user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } });
});

authRoutes.post('/change-password', requireAuth, async (c) => {
  const authUser = c.get('user');
  const user = findById(authUser.id);
  if (!user) return c.json({ error: 'user not found' }, 404);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object') return c.json({ error: 'invalid body' }, 400);
  const { currentPassword, newPassword } = body as Record<string, unknown>;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return c.json({ error: 'currentPassword and newPassword are required' }, 400);
  }
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return c.json({ error: 'current password is incorrect' }, 400);
  if (newPassword.length < 8) return c.json({ error: 'new password must be at least 8 characters' }, 400);
  const newHash = await hashPassword(newPassword);
  try {
    const updated = await updateUserRecord(user.id, { passwordHash: newHash });
    if (!updated) return c.json({ error: 'user not found' }, 404);
  } catch (error) {
    console.error('[auth] password change could not be saved:', error);
    return c.json({ error: 'password change could not be saved' }, 503);
  }
  return c.json({ ok: true, message: 'password changed successfully' });
});

function sanitizedStaff(user: UserRecord) {
  return { id: user.id, email: user.email, name: user.name, role: 'staff' as const, createdAt: user.createdAt };
}

authRoutes.get('/staff', requireAuth, requireRole('admin'), async (c) => {
  try {
    const staff = await listStaffUserRecords();
    return c.json({ staff: staff.map(sanitizedStaff) });
  } catch (error) {
    console.error('[auth] staff listing could not be loaded:', error);
    return c.json({ error: 'staff listing unavailable' }, 503);
  }
});

authRoutes.post('/staff', requireAuth, requireRole('admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid body' }, 400);
  const { email, name, password } = body as Record<string, unknown>;
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) return c.json({ error: 'invalid email' }, 400);
  if (typeof name !== 'string' || !name.trim()) return c.json({ error: 'invalid name' }, 400);
  if (typeof password !== 'string' || password.length < 8) return c.json({ error: 'password must be at least 8 chars' }, 400);
  try {
    if (await findUserByEmailRecord(email.trim())) return c.json({ error: 'email already registered' }, 409);
    const user = await createUserRecord({ email: email.trim(), name: name.trim(), passwordHash: await hashPassword(password), role: 'staff' });
    return c.json({ staff: sanitizedStaff(user) }, 201);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return c.json({ error: 'email already registered' }, 409);
    }
    console.error('[auth] staff creation could not be saved:', error);
    return c.json({ error: 'staff creation could not be saved' }, 503);
  }
});

authRoutes.patch('/staff/:id', requireAuth, requireRole('admin'), async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return c.json({ error: 'invalid body' }, 400);
  const updates = body as Record<string, unknown>;
  if ('role' in updates || Object.keys(updates).some((key) => !['email', 'name', 'password'].includes(key))) {
    return c.json({ error: 'only email, name, and password can be updated' }, 400);
  }
  if (Object.keys(updates).length === 0) return c.json({ error: 'at least one update is required' }, 400);
  if ('email' in updates && (typeof updates.email !== 'string' || !EMAIL_RE.test(updates.email.trim()))) return c.json({ error: 'invalid email' }, 400);
  if ('name' in updates && (typeof updates.name !== 'string' || !updates.name.trim())) return c.json({ error: 'invalid name' }, 400);
  if ('password' in updates && (typeof updates.password !== 'string' || updates.password.length < 8)) return c.json({ error: 'password must be at least 8 chars' }, 400);
  try {
    const user = await updateUserRecord(c.req.param('id'), {
      email: typeof updates.email === 'string' ? updates.email.trim() : undefined,
      name: typeof updates.name === 'string' ? updates.name.trim() : undefined,
      passwordHash: typeof updates.password === 'string' ? await hashPassword(updates.password) : undefined,
    });
    if (!user || user.role !== 'staff') return c.json({ error: 'staff user not found' }, 404);
    return c.json({ staff: sanitizedStaff(user) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return c.json({ error: 'email already registered' }, 409);
    }
    if (error instanceof Error && error.message === 'email already registered') return c.json({ error: error.message }, 409);
    console.error('[auth] staff update could not be saved:', error);
    return c.json({ error: 'staff update could not be saved' }, 503);
  }
});

authRoutes.delete('/staff/:id', requireAuth, requireRole('admin'), async (c) => {
  try {
    if (!await deleteStaffUserRecord(c.req.param('id'))) return c.json({ error: 'staff user not found' }, 404);
    return c.json({ ok: true });
  } catch (error) {
    console.error('[auth] staff deletion could not be saved:', error);
    return c.json({ error: 'staff deletion could not be saved' }, 503);
  }
});
