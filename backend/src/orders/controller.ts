/**
 * Orders controller — SmartStock order API handlers.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import type { Context } from 'hono';
import {
  addOrderRecord,
  cancelOrderRecord,
  editOrderRecord,
  getOrderByReferenceRecord,
  getOrderRecord,
  listOrderPageRecords,
  listOrderRecords,
  processPayment,
  processRefund,
} from './service.js';

export function listOrdersController(c: Context) {
  return c.json(listOrderRecords());
}

const ORDER_PAGE_STATUSES = ['all', 'pending', 'ready_for_pickup', 'packed', 'out_for_delivery', 'completed', 'cancelled'] as const;

function validDate(value: string | undefined): value is string {
  return value !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function parseOrdersCursor(value: string | undefined): { createdAt: string; id: string } | null | false {
  if (!value) return null;
  if (value.length > 512) return false;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return false;
    const cursor = parsed as Record<string, unknown>;
    if (typeof cursor.createdAt !== 'string' || !Number.isFinite(Date.parse(cursor.createdAt))
      || typeof cursor.id !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cursor.id)) return false;
    return { createdAt: cursor.createdAt, id: cursor.id };
  } catch {
    return false;
  }
}

export async function listOrdersPageController(c: Context) {
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);
  const rawStatus = c.req.query('status') ?? 'all';
  if (!ORDER_PAGE_STATUSES.includes(rawStatus as typeof ORDER_PAGE_STATUSES[number])) return c.json({ error: 'status is invalid' }, 400);
  const search = (c.req.query('search') ?? '').trim();
  if (search.length > 200) return c.json({ error: 'search must be 200 characters or fewer' }, 400);
  const fromDate = c.req.query('from') || null;
  const toDate = c.req.query('to') || null;
  if (fromDate && !validDate(fromDate)) return c.json({ error: 'from must be a valid YYYY-MM-DD date' }, 400);
  if (toDate && !validDate(toDate)) return c.json({ error: 'to must be a valid YYYY-MM-DD date' }, 400);
  if (fromDate && toDate && fromDate > toDate) return c.json({ error: 'from must not be after to' }, 400);
  const cursor = parseOrdersCursor(c.req.query('cursor'));
  if (cursor === false) return c.json({ error: 'cursor is invalid' }, 400);
  try {
    const result = await listOrderPageRecords({
      limit,
      status: rawStatus as typeof ORDER_PAGE_STATUSES[number],
      search,
      fromDate,
      toDate,
      cursorCreatedAt: cursor?.createdAt ?? null,
      cursorId: cursor?.id ?? null,
    });
    const nextCursor = result.nextCursor ? Buffer.from(JSON.stringify(result.nextCursor)).toString('base64url') : null;
    return c.json({
      orders: result.orders,
      page: { limit, totalCount: result.totalCount, hasMore: result.hasMore, nextCursor },
      summary: { pendingCount: result.pendingCount, inProgressCount: result.inProgressCount, completedCount: result.completedCount },
    });
  } catch (error) {
    console.error('[orders] paginated listing could not be loaded:', error);
    return c.json({ error: 'orders listing unavailable' }, 503);
  }
}

export function getOrderController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const result = getOrderRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export function getOrderByReferenceController(c: Context) {
  const referenceNumber = c.req.param('referenceNumber');
  if (!referenceNumber) return c.json({ error: 'reference number is required' }, 400);
  const result = getOrderByReferenceRecord(referenceNumber);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function createOrderController(c: Context) {
  const body = await c.req.json().catch(() => null);
  const result = await addOrderRecord(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function updateOrderController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await editOrderRecord(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function deleteOrderController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const result = await cancelOrderRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function processPaymentController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await processPayment(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function processRefundController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await processRefund(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}
