/**
 * Inventory service — validation and Product-shaped business logic.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-07
 */

import {
  createProduct,
  deleteProduct,
  findProductById,
  listProducts,
  updateProduct,
  type Product,
  type ProductCategory,
  type ProductCreateInput,
  type ProductStatus,
  type ProductUpdateInput,
} from './store.js';

type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: 400 | 404 | 409; error: string };

interface ProductFilters {
  q?: string;
  status?: ProductStatus;
  category?: ProductCategory;
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

function readCategory(value: unknown, required = true): ServiceResult<ProductCategory | undefined> {
  const parsed = readString(value, 'category', required);
  if (!parsed.ok || parsed.data === undefined) return parsed as ServiceResult<ProductCategory | undefined>;
  if (parsed.data !== 'glass' && parsed.data !== 'aluminum') {
    return { ok: false, status: 400, error: 'category must be glass or aluminum' };
  }
  return { ok: true, data: parsed.data };
}

function readStatus(value: unknown, required = true): ServiceResult<ProductStatus | undefined> {
  const parsed = readString(value, 'status', required);
  if (!parsed.ok || parsed.data === undefined) return parsed as ServiceResult<ProductStatus | undefined>;
  if (parsed.data !== 'active' && parsed.data !== 'discontinued') {
    return { ok: false, status: 400, error: 'status must be active or discontinued' };
  }
  return { ok: true, data: parsed.data };
}

function parseCreate(body: unknown): ServiceResult<ProductCreateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const sku = readString(input.sku, 'sku');
  if (!sku.ok) return sku;
  const name = readString(input.name, 'name');
  if (!name.ok) return name;
  const category = readCategory(input.category);
  if (!category.ok) return category;
  const unit = readString(input.unit, 'unit');
  if (!unit.ok) return unit;
  const stock = readNumber(input.stock, 'stock');
  if (!stock.ok) return stock;
  const price = readNumber(input.price, 'price');
  if (!price.ok) return price;
  const threshold = readNumber(input.threshold, 'threshold');
  if (!threshold.ok) return threshold;
  const status = readStatus(input.status, false);
  if (!status.ok) return status;
  const description = readString(input.description, 'description', false);
  if (!description.ok) return description;

  if (
    sku.data === undefined ||
    name.data === undefined ||
    category.data === undefined ||
    unit.data === undefined ||
    stock.data === undefined ||
    price.data === undefined ||
    threshold.data === undefined
  ) {
    return { ok: false, status: 400, error: 'missing required product fields' };
  }

  return {
    ok: true,
    data: {
      sku: sku.data,
      name: name.data,
      category: category.data,
      unit: unit.data,
      stock: stock.data,
      price: price.data,
      threshold: threshold.data,
      status: status.data,
      description: description.data,
    },
  };
}

function parseUpdate(body: unknown): ServiceResult<ProductUpdateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const data: ProductUpdateInput = {};

  for (const field of ['sku', 'name', 'unit', 'description'] as const) {
    if (field in input) {
      const parsed = readString(input[field], field, false);
      if (!parsed.ok) return parsed;
      data[field] = parsed.data;
    }
  }

  if ('category' in input) {
    const parsed = readCategory(input.category, false);
    if (!parsed.ok) return parsed;
    data.category = parsed.data;
  }

  if ('status' in input) {
    const parsed = readStatus(input.status, false);
    if (!parsed.ok) return parsed;
    data.status = parsed.data;
  }

  for (const field of ['stock', 'price', 'threshold'] as const) {
    if (field in input) {
      const parsed = readNumber(input[field], field, false);
      if (!parsed.ok) return parsed;
      data[field] = parsed.data;
    }
  }

  if (Object.keys(data).length === 0) return { ok: false, status: 400, error: 'no fields to update' };
  return { ok: true, data };
}

export function listProductRecords(filters: ProductFilters = {}): Product[] {
  const q = filters.q?.trim().toLowerCase();
  return listProducts().filter((product) => {
    if (filters.status && product.status !== filters.status) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (!q) return true;
    return [product.sku, product.name, product.category, product.description]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));
  });
}

export function getProductRecord(id: string): ServiceResult<Product> {
  const item = findProductById(id);
  return item ? { ok: true, data: item } : { ok: false, status: 404, error: 'product not found' };
}

export function addProductRecord(body: unknown): ServiceResult<Product> {
  const parsed = parseCreate(body);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, data: createProduct(parsed.data) };
  } catch (error) {
    return { ok: false, status: 409, error: error instanceof Error ? error.message : 'product conflict' };
  }
}

export function editProductRecord(id: string, body: unknown): ServiceResult<Product> {
  const parsed = parseUpdate(body);
  if (!parsed.ok) return parsed;
  try {
    const item = updateProduct(id, parsed.data);
    return item ? { ok: true, data: item } : { ok: false, status: 404, error: 'product not found' };
  } catch (error) {
    return { ok: false, status: 409, error: error instanceof Error ? error.message : 'product conflict' };
  }
}

export function removeProductRecord(id: string): ServiceResult<{ ok: true }> {
  return deleteProduct(id)
    ? { ok: true, data: { ok: true } }
    : { ok: false, status: 404, error: 'product not found' };
}
