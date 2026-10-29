import { Hono } from 'hono';
import { requireAuth, requireStaffOrAdmin } from '../auth/middleware.js';
import { listOrderRecords } from '../orders/service.js';
import type { DailySalesOrder, DailySalesSummary } from './types.js';

export const dailySalesRoutes = new Hono();

dailySalesRoutes.use('*', requireAuth, requireStaffOrAdmin);

dailySalesRoutes.get('/', (c) => {
  const date = c.req.query('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'date must be a valid YYYY-MM-DD date' }, 400);
  }
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return c.json({ error: 'date must be a valid YYYY-MM-DD date' }, 400);
  }

  const orders: DailySalesOrder[] = listOrderRecords()
    .filter((order) => order.createdAt.slice(0, 10) === date)
    .map((order) => ({
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
    }));
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
    orders,
  };
  return c.json(summary);
});
