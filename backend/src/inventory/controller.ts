/**
 * Inventory controller — Product API handlers for SmartStock frontend.
 *
 * Author: Hazel
 * Last touched: 2026-07-07
 */

import type { Context } from 'hono';
import {
  addInboundStockRecord,
  addOutboundStockRecord,
  addProductRecord,
  editProductRecord,
  getProductMovementRecords,
  getProductRecord,
  listLowStockProductRecords,
  listProductPageRecords,
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

function parseProductCursor(value: string | undefined): { name: string; id: string } | null | false {
  if (!value) return null;
  if (value.length > 1024) return false;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return false;
    const cursor = parsed as Record<string, unknown>;
    if (typeof cursor.name !== 'string' || cursor.name.length > 200
      || typeof cursor.id !== 'string' || cursor.id.length === 0 || cursor.id.length > 64) return false;
    return { name: cursor.name, id: cursor.id };
  } catch {
    return false;
  }
}

export async function listProductPageController(c: Context) {
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);
  const rawCategory = c.req.query('category') ?? 'all';
  if (rawCategory !== 'all' && !toCategory(rawCategory)) return c.json({ error: 'category is invalid' }, 400);
  const stock = c.req.query('stock') ?? 'all';
  if (!['all', 'low', 'healthy'].includes(stock)) return c.json({ error: 'stock filter is invalid' }, 400);
  const search = (c.req.query('q') ?? '').trim().toLowerCase();
  if (search.length > 200) return c.json({ error: 'search query must be at most 200 characters' }, 400);
  const cursor = parseProductCursor(c.req.query('cursor'));
  if (cursor === false) return c.json({ error: 'cursor is invalid' }, 400);
  try {
    const result = await listProductPageRecords({
      limit,
      category: rawCategory as 'all' | ProductCategory,
      stock: stock as 'all' | 'low' | 'healthy',
      searchTokens: search.split(/\s+/).filter(Boolean),
      cursorName: cursor?.name ?? null,
      cursorId: cursor?.id ?? null,
    });
    const nextCursor = result.nextCursor ? Buffer.from(JSON.stringify(result.nextCursor)).toString('base64url') : null;
    return c.json({
      items: result.items,
      page: { limit, totalCount: result.totalCount, hasMore: result.hasMore, nextCursor },
      summary: {
        totalProducts: result.totalProducts,
        glassCount: result.glassCount,
        aluminumCount: result.aluminumCount,
        lowStockCount: result.lowStockCount,
        outOfStockCount: result.outOfStockCount,
        totalInventoryValue: Number(result.totalInventoryValue),
        glassInventoryValue: Number(result.glassInventoryValue),
        aluminumInventoryValue: Number(result.aluminumInventoryValue),
        activeProductCount: result.activeProductCount,
        activeGlassCount: result.activeGlassCount,
        activeAluminumCount: result.activeAluminumCount,
        activeLowStockCount: result.activeLowStockCount,
        healthyStockCount: result.healthyStockCount,
        lowStockStatusCount: result.lowStockStatusCount,
        criticalStockCount: result.criticalStockCount,
        stockAlertProducts: result.stockAlertProducts,
      },
    });
  } catch (error) {
    console.error('[inventory] paginated product list unavailable:', error);
    return c.json({ error: 'inventory listing unavailable' }, 503);
  }
}

export async function listProductsController(c: Context) {
  if (c.req.query('mode') === 'page') return listProductPageController(c);
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
  const result = await addProductRecord(body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function updateProductController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await editProductRecord(id, body);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function deleteProductController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const result = await removeProductRecord(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export async function inboundStockController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await addInboundStockRecord(id, { ...(typeof body === 'object' && body !== null ? body : {}), createdBy: c.get('user').email });
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export async function outboundStockController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const body = await c.req.json().catch(() => null);
  const result = await addOutboundStockRecord(id, { ...(typeof body === 'object' && body !== null ? body : {}), createdBy: c.get('user').email });
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data, 201);
}

export function listProductMovementsController(c: Context) {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'product id is required' }, 400);
  const result = getProductMovementRecords(id);
  if (!result.ok) return c.json({ error: result.error }, result.status);
  return c.json(result.data);
}

export function listLowStockProductsController(c: Context) {
  return c.json(listLowStockProductRecords());
}
