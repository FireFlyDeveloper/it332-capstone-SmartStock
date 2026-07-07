/**
 * Inventory service — validation, filtering, stock calculations.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-07
 */

import {
  createInventory,
  deleteInventory,
  findInventoryById,
  listInventory,
  updateInventory,
  type InventoryCreateInput,
  type InventoryItem,
  type InventoryUpdateInput,
} from './store.js';

type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: 400 | 404 | 409; error: string };

interface InventoryFilters {
  q?: string;
  status?: InventoryItem['status'];
  category?: string;
}

function readString(value: unknown, field: string, required = true): ServiceResult<string | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, status: 400, error: `${field} must be a non-empty string` };
  }
  return { ok: true, data: value.trim() };
}

function readNumber(value: unknown, field: string, required = true): ServiceResult<number | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { ok: false, status: 400, error: `${field} must be a non-negative number` };
  }
  return { ok: true, data: value };
}

function parseCreate(body: unknown): ServiceResult<InventoryCreateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const sku = readString(input.sku, 'sku');
  if (!sku.ok) return sku;
  const name = readString(input.name, 'name');
  if (!name.ok) return name;
  const category = readString(input.category, 'category');
  if (!category.ok) return category;
  const unit = readString(input.unit, 'unit');
  if (!unit.ok) return unit;
  const quantity = readNumber(input.quantity, 'quantity');
  if (!quantity.ok) return quantity;
  const reorderLevel = readNumber(input.reorderLevel, 'reorderLevel');
  if (!reorderLevel.ok) return reorderLevel;
  const supplier = readString(input.supplier, 'supplier', false);
  if (!supplier.ok) return supplier;
  const location = readString(input.location, 'location', false);
  if (!location.ok) return location;

  const required = {
    sku: sku.data,
    name: name.data,
    category: category.data,
    unit: unit.data,
    quantity: quantity.data,
    reorderLevel: reorderLevel.data,
  };

  if (
    required.sku === undefined ||
    required.name === undefined ||
    required.category === undefined ||
    required.unit === undefined ||
    required.quantity === undefined ||
    required.reorderLevel === undefined
  ) {
    return { ok: false, status: 400, error: 'missing required inventory fields' };
  }

  return {
    ok: true,
    data: {
      sku: required.sku,
      name: required.name,
      category: required.category,
      unit: required.unit,
      quantity: required.quantity,
      reorderLevel: required.reorderLevel,
      supplier: supplier.data,
      location: location.data,
    },
  };
}

function parseUpdate(body: unknown): ServiceResult<InventoryUpdateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const data: InventoryUpdateInput = {};

  for (const [field, reader] of [
    ['sku', readString],
    ['name', readString],
    ['category', readString],
    ['unit', readString],
    ['supplier', readString],
    ['location', readString],
  ] as const) {
    if (field in input) {
      const parsed = reader(input[field], field, false);
      if (!parsed.ok) return parsed;
      data[field] = parsed.data;
    }
  }

  for (const field of ['quantity', 'reorderLevel'] as const) {
    if (field in input) {
      const parsed = readNumber(input[field], field, false);
      if (!parsed.ok) return parsed;
      data[field] = parsed.data;
    }
  }

  if (Object.keys(data).length === 0) return { ok: false, status: 400, error: 'no fields to update' };
  return { ok: true, data };
}

export function getInventory(filters: InventoryFilters = {}) {
  const q = filters.q?.trim().toLowerCase();
  const category = filters.category?.trim().toLowerCase();
  const rows = listInventory().filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (category && item.category.toLowerCase() !== category) return false;
    if (!q) return true;
    return [item.sku, item.name, item.category, item.supplier, item.location]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));
  });
  return {
    items: rows,
    total: rows.length,
    lowStock: rows.filter((item) => item.status === 'low_stock').length,
    outOfStock: rows.filter((item) => item.status === 'out_of_stock').length,
  };
}

export function getInventoryItem(id: string): ServiceResult<InventoryItem> {
  const item = findInventoryById(id);
  return item ? { ok: true, data: item } : { ok: false, status: 404, error: 'inventory item not found' };
}

export function addInventoryItem(body: unknown): ServiceResult<InventoryItem> {
  const parsed = parseCreate(body);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, data: createInventory(parsed.data) };
  } catch (error) {
    return { ok: false, status: 409, error: error instanceof Error ? error.message : 'inventory conflict' };
  }
}

export function editInventoryItem(id: string, body: unknown): ServiceResult<InventoryItem> {
  const parsed = parseUpdate(body);
  if (!parsed.ok) return parsed;
  try {
    const item = updateInventory(id, parsed.data);
    return item ? { ok: true, data: item } : { ok: false, status: 404, error: 'inventory item not found' };
  } catch (error) {
    return { ok: false, status: 409, error: error instanceof Error ? error.message : 'inventory conflict' };
  }
}

export function removeInventoryItem(id: string): ServiceResult<{ deleted: true }> {
  return deleteInventory(id)
    ? { ok: true, data: { deleted: true } }
    : { ok: false, status: 404, error: 'inventory item not found' };
}
