import { Hono } from 'hono';
import { requireAuth } from '../auth/middleware.js';
import { isDbSyncActive } from '../db/syncState.js';
import { getNotificationPageDb } from '../db/postgresStore.js';
import { listProducts } from '../inventory/store.js';
import { listOrders } from '../orders/store.js';
import { buildNotificationFeed, listActiveNotificationIds, listNewNotificationItems, paginateNotificationFeed } from './feed.js';

export const notificationRoutes = new Hono();
notificationRoutes.use('*', requireAuth);

function stringArray(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10_000 || value.some((item) => typeof item !== 'string')) return null;
  return value as string[];
}

notificationRoutes.get('/', async (c) => c.json(buildNotificationFeed(listProducts(), listOrders())));

notificationRoutes.post('/page', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }

  const readIds = stringArray(body.readIds);
  const dismissedIds = stringArray(body.dismissedIds);
  if (!readIds || !dismissedIds) return c.json({ error: 'readIds and dismissedIds must be arrays of at most 10000 strings' }, 400);
  if (body.cursor !== undefined && body.cursor !== null && typeof body.cursor !== 'string') return c.json({ error: 'cursor must be a string' }, 400);
  if (body.unreadOnly !== undefined && typeof body.unreadOnly !== 'boolean') return c.json({ error: 'unreadOnly must be a boolean' }, 400);
  const limit = body.limit === undefined ? 25 : Number(body.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);

  const input = {
    limit,
    cursor: body.cursor as string | null | undefined,
    readIds,
    dismissedIds,
    unreadOnly: body.unreadOnly as boolean | undefined,
  };
  if (isDbSyncActive()) {
    try {
      const result = await getNotificationPageDb(input);
      if (!result) return c.json({ error: 'PostgreSQL is unavailable for notifications' }, 503);
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load notification page';
      const status = message.startsWith('cursor') || message.startsWith('limit') ? 400 : 503;
      return c.json({ error: message }, status);
    }
  }

  try {
    const feed = buildNotificationFeed(listProducts(), listOrders());
    return c.json(paginateNotificationFeed(feed, input));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Invalid notification page request' }, 400);
  }
});

notificationRoutes.post('/changes', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }
  const knownIds = stringArray(body.knownIds);
  const dismissedIds = stringArray(body.dismissedIds);
  if (!knownIds || !dismissedIds) return c.json({ error: 'knownIds and dismissedIds must be arrays of at most 10000 strings' }, 400);
  const dismissed = new Set(dismissedIds);
  const items = listNewNotificationItems(buildNotificationFeed(listProducts(), listOrders()), knownIds)
    .filter((item) => !dismissed.has(item.id));
  return c.json({ items });
});

notificationRoutes.post('/ids', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json<Record<string, unknown>>();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }
  const dismissedIds = stringArray(body.dismissedIds);
  if (!dismissedIds) return c.json({ error: 'dismissedIds must be an array of at most 10000 strings' }, 400);
  const feed = buildNotificationFeed(listProducts(), listOrders());
  return c.json({ ids: listActiveNotificationIds(feed, dismissedIds) });
});
