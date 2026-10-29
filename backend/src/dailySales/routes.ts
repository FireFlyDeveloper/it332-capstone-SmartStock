import { Hono } from 'hono';
import { requireAuth, requireStaffOrAdmin } from '../auth/middleware.js';
import { isDbSyncActive } from '../db/syncState.js';
import { listDailySalesPageDb } from '../db/postgresStore.js';
import { listOrderRecords } from '../orders/service.js';
import type { Order } from '../orders/store.js';
import type { DailySalesOrder, DailySalesSummary } from './types.js';

export const dailySalesRoutes = new Hono();

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const ORDER_STATUSES = new Set(['processing', 'in_transit', 'delivered', 'cancelled']);

function parseCursor(value: string | undefined): { referenceNumber: string; id: string } | null | false {
  if (!value) return null;
  if (value.length > 512) return false;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return false;
    const cursor = parsed as Record<string, unknown>;
    if (typeof cursor.referenceNumber !== 'string' || typeof cursor.id !== 'string') return false;
    return { referenceNumber: cursor.referenceNumber, id: cursor.id };
  } catch {
    return false;
  }
}

function encodeCursor(order: DailySalesOrder): string {
  return Buffer.from(JSON.stringify({ referenceNumber: order.referenceNumber, id: order.id })).toString('base64url');
}

function toDailySalesOrder(order: Order): DailySalesOrder {
  return {
    id: order.id,
    referenceNumber: order.referenceNumber,
    customerName: order.customerName,
    items: order.items.map((item) => ({ ...item })),
    total: order.total,
    paidAmount: order.paidAmount,
    refundedAmount: order.refundedAmount,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
  };
}

dailySalesRoutes.use('*', requireAuth, requireStaffOrAdmin);

dailySalesRoutes.get('/', async (c) => {
  const date = c.req.query('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'date must be a valid YYYY-MM-DD date' }, 400);
  }
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return c.json({ error: 'date must be a valid YYYY-MM-DD date' }, 400);
  }

  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? DEFAULT_PAGE_SIZE : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return c.json({ error: `limit must be an integer between 1 and ${MAX_PAGE_SIZE}` }, 400);
  }
  const cursor = parseCursor(c.req.query('cursor'));
  if (cursor === false) return c.json({ error: 'cursor is invalid' }, 400);
  const rawStatus = c.req.query('status') ?? 'all';
  if (rawStatus !== 'all' && !ORDER_STATUSES.has(rawStatus)) {
    return c.json({ error: 'status is invalid' }, 400);
  }
  const query = (c.req.query('q') ?? '').trim().toLowerCase();
  if (query.length > 100) return c.json({ error: 'q must be at most 100 characters' }, 400);

  if (isDbSyncActive()) {
    try {
      const dbPage = await listDailySalesPageDb({
        date,
        limit,
        status: rawStatus,
        search: query,
        cursorReferenceNumber: cursor?.referenceNumber ?? null,
        cursorId: cursor?.id ?? null,
      });
      if (!dbPage) return c.json({ error: 'Daily Sales database is unavailable' }, 503);
      const pageOrders = dbPage.orders.map(toDailySalesOrder);
      return c.json({
        date,
        orderCount: dbPage.orderCount,
        cancelledOrderCount: dbPage.cancelledOrderCount,
        grossSales: dbPage.grossSales,
        collectedAmount: dbPage.collectedAmount,
        refundsAmount: dbPage.refundsAmount,
        netCollectedAmount: dbPage.netCollectedAmount,
        orders: pageOrders,
        page: {
          limit,
          totalCount: dbPage.totalCount,
          hasMore: dbPage.hasMore,
          nextCursor: dbPage.hasMore && pageOrders.length ? encodeCursor(pageOrders[pageOrders.length - 1]) : null,
        },
      } satisfies DailySalesSummary);
    } catch (error) {
      console.error('[daily-sales] PostgreSQL page query failed:', error);
      return c.json({ error: 'Daily Sales could not be loaded from the database' }, 503);
    }
  }

  const orders: DailySalesOrder[] = listOrderRecords()
    .filter((order) => order.createdAt.slice(0, 10) === date)
    .map(toDailySalesOrder)
    .sort((a, b) => a.referenceNumber.localeCompare(b.referenceNumber) || a.id.localeCompare(b.id));

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = rawStatus === 'all' || order.orderStatus === rawStatus;
    const matchesQuery = !query || order.referenceNumber.toLowerCase().includes(query)
      || order.customerName.toLowerCase().includes(query)
      || order.items.some((item) => item.name.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });
  const cursorOrders = cursor
    ? filteredOrders.filter((order) => order.referenceNumber.localeCompare(cursor.referenceNumber) > 0
      || (order.referenceNumber === cursor.referenceNumber && order.id.localeCompare(cursor.id) > 0))
    : filteredOrders;
  const pageWithLookahead = cursorOrders.slice(0, limit + 1);
  const hasMore = pageWithLookahead.length > limit;
  const pageOrders = pageWithLookahead.slice(0, limit);
  const activeOrders = orders.filter((order) => order.orderStatus !== 'cancelled');
  const netCollectedAmount = orders.reduce((sum, order) => sum + order.paidAmount, 0);
  const refundsAmount = orders.reduce((sum, order) => sum + order.refundedAmount, 0);
  const collectedAmount = netCollectedAmount + refundsAmount;
  const summary: DailySalesSummary = {
    date,
    orderCount: activeOrders.length,
    cancelledOrderCount: orders.length - activeOrders.length,
    grossSales: activeOrders.reduce((sum, order) => sum + order.total, 0),
    collectedAmount,
    refundsAmount,
    netCollectedAmount,
    orders: pageOrders,
    page: {
      limit,
      totalCount: filteredOrders.length,
      hasMore,
      nextCursor: hasMore && pageOrders.length ? encodeCursor(pageOrders[pageOrders.length - 1]) : null,
    },
  };
  return c.json(summary);
});
