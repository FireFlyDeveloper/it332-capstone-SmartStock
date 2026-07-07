/**
 * Inventory controller — HTTP handlers for stock CRUD.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-07
 */

import type { Context } from 'hono';
import {
  addInventoryItem,
  editInventoryItem,
  getInventory,
  getInventoryItem,
  removeInventoryItem,
} from './service.js';
import type { InventoryStatus } from './store.js';

function toStatus(value: string | undefined): InventoryStatus | undefined {
  if (value === 'in_stock' || value === 'low_stock' || value === 'out_of_stock') return value;
  return undefined;
}

export function listInventoryController(c: Context) {
  const statusQuery = c.req.query('status');
  const status = toStatus(statusQuery);
  if (statusQuery && !status) return c.json({ error: 'invalid status filter' }, 400);
  return c.json({ data: getInventory({ q: c.req.query('q'), category: c.req.query('category'), status }) });
}

export function getInventoryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'inventory item id is required' }, 400);
  const result = getInventoryItem(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json({ item: result.data });
}

export async function createInventoryController(c: Context) {
  const body = await c.req.json().catch(() => null);
  const result = addInventoryItem(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json({ item: result.data }, 201);
}

export async function updateInventoryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'inventory item id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = editInventoryItem(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json({ item: result.data });
}

export function deleteInventoryController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'inventory item id is required' }, 400);
  const result = removeInventoryItem(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}
