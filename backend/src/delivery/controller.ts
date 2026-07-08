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

export function listDeliveriesController(c: Context) {
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
  const result = addDeliveryRecord(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function updateDeliveryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'delivery id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = editDeliveryRecord(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export function deleteDeliveryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'delivery id is required' }, 400);
  const result = removeDeliveryRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}
