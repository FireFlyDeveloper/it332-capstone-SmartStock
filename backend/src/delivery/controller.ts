/**
 * Delivery controller — Delivery API handlers for SmartStock frontend.
 *
 * Author: Hazel
 * Last touched: 2026-07-08
 */

import type { Context } from 'hono';
import {
  addDeliveryRecord,
  editDeliveryRecord,
  getDeliveryRecord,
  listDeliveryPageRecords,
  listDeliveryRecords,
  parseDeliveryStatus,
  parseTrafficLevel,
  removeDeliveryRecord,
} from './service.js';
import type { DeliveryStatusFlow, TrafficLevel } from './store.js';

function toStatus(value: string | undefined): DeliveryStatusFlow | undefined {
  if (!value) return undefined;
  const parsed = parseDeliveryStatus(value, false);
  return parsed.ok ? parsed.data : undefined;
}

function toTrafficLevel(value: string | undefined): TrafficLevel | undefined {
  if (!value) return undefined;
  const parsed = parseTrafficLevel(value, false);
  return parsed.ok ? parsed.data : undefined;
}

function parseDeliveryCursor(value: string | undefined): { createdAt: string; orderId: string } | null | false {
  if (!value) return null;
  if (value.length > 512) return false;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return false;
    const cursor = parsed as Record<string, unknown>;
    if (typeof cursor.createdAt !== 'string' || !Number.isFinite(Date.parse(cursor.createdAt))
      || typeof cursor.orderId !== 'string' || cursor.orderId.length === 0 || cursor.orderId.length > 64) return false;
    return { createdAt: cursor.createdAt, orderId: cursor.orderId };
  } catch {
    return false;
  }
}

export async function listDeliveriesPageController(c: Context) {
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);
  const rawStatus = c.req.query('status') ?? 'all';
  if (!['all', 'pending', 'in_transit', 'delivered'].includes(rawStatus)) return c.json({ error: 'status is invalid' }, 400);
  const cursor = parseDeliveryCursor(c.req.query('cursor'));
  if (cursor === false) return c.json({ error: 'cursor is invalid' }, 400);
  try {
    const result = await listDeliveryPageRecords({
      limit,
      status: rawStatus as 'all' | 'pending' | 'in_transit' | 'delivered',
      cursorCreatedAt: cursor?.createdAt ?? null,
      cursorOrderId: cursor?.orderId ?? null,
    });
    const nextCursor = result.nextCursor ? Buffer.from(JSON.stringify(result.nextCursor)).toString('base64url') : null;
    return c.json({
      items: result.items,
      page: { limit, totalCount: result.totalCount, hasMore: result.hasMore, nextCursor },
      summary: { totalCount: result.pendingCount + result.inTransitCount + result.deliveredCount, pendingCount: result.pendingCount, inTransitCount: result.inTransitCount, deliveredCount: result.deliveredCount },
    });
  } catch (error) {
    console.error('[delivery] paginated listing could not be loaded:', error);
    return c.json({ error: 'deliveries listing unavailable' }, 503);
  }
}

export async function listDeliveriesController(c: Context) {
  if (c.req.query('mode') === 'page') return listDeliveriesPageController(c);
  const statusQuery = c.req.query('status');
  const trafficQuery = c.req.query('trafficLevel');
  const status = toStatus(statusQuery);
  const trafficLevel = toTrafficLevel(trafficQuery);
  if (statusQuery && !status) return c.json({ error: 'invalid status filter' }, 400);
  if (trafficQuery && !trafficLevel) return c.json({ error: 'invalid trafficLevel filter' }, 400);
  return c.json(listDeliveryRecords({ q: c.req.query('q'), status, trafficLevel }));
}

export function getDeliveryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'delivery id is required' }, 400);
  const result = getDeliveryRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function createDeliveryController(c: Context) {
  const body = await c.req.json().catch(() => null);
  const result = await addDeliveryRecord(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function updateDeliveryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'delivery id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await editDeliveryRecord(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function deleteDeliveryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'delivery id is required' }, 400);
  const result = await removeDeliveryRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}
