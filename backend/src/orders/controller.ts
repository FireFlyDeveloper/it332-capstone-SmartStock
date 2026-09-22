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
  listOrderRecords,
  processPayment,
  processRefund,
} from './service.js';

export function listOrdersController(c: Context) {
  return c.json(listOrderRecords());
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
  const result = addOrderRecord(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function updateOrderController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = editOrderRecord(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export function deleteOrderController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const result = cancelOrderRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function processPaymentController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = processPayment(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function processRefundController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'order id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = processRefund(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}
