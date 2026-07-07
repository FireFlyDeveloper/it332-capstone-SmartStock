/**
 * Inventory controller — Product API handlers for SmartStock frontend.
 *
 * Author: Hazel
 * Last touched: 2026-07-07
 */

import type { Context } from 'hono';
import {
  addProductRecord,
  editProductRecord,
  getProductRecord,
  listProductRecords,
  removeProductRecord,
} from './service.js';
import type { ProductCategory, ProductStatus } from './store.js';

function toCategory(value: string | undefined): ProductCategory | undefined {
  if (value === 'glass' || value === 'aluminum') return value;
  return undefined;
}

function toStatus(value: string | undefined): ProductStatus | undefined {
  if (value === 'active' || value === 'discontinued') return value;
  return undefined;
}

export function listProductsController(c: Context) {
  const statusQuery = c.req.query('status');
  const categoryQuery = c.req.query('category');
  const status = toStatus(statusQuery);
  const category = toCategory(categoryQuery);
  if (statusQuery && !status) return c.json({ error: 'invalid status filter' }, 400);
  if (categoryQuery && !category) return c.json({ error: 'invalid category filter' }, 400);
  return c.json(listProductRecords({ q: c.req.query('q'), status, category }));
}

export function getProductController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const result = getProductRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function createProductController(c: Context) {
  const body = await c.req.json().catch(() => null);
  const result = addProductRecord(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function updateProductController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = editProductRecord(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export function deleteProductController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const result = removeProductRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}
