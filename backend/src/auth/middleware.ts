/**
 * Bearer-token auth middleware.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-06-29
 */

import type { Context, MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken, type JwtPayload } from './jwt.js';
import { findById, type UserRecord } from './users.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: UserRecord;
    jwt: JwtPayload;
  }
}

function extractToken(c: Context): string | null {
  const header = c.req.header('authorization');
  if (header) {
    const [scheme, token] = header.split(/\s+/, 2);
    if (scheme?.toLowerCase() === 'bearer' && token) return token;
  }
  return getCookie(c, 'auth_token') ?? null;
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = extractToken(c);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const payload = verifyToken(token);
  if (!payload) return c.json({ error: 'invalid token' }, 401);
  const user = findById(payload.sub);
  if (!user) return c.json({ error: 'user not found' }, 401);
  c.set('user', user);
  c.set('jwt', payload);
  await next();
};

export const requireRole = (role: 'admin'): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'unauthorized' }, 401);
    if (user.role !== role) return c.json({ error: 'forbidden' }, 403);
    await next();
  };
};
