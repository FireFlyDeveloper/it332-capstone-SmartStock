/**
 * Inventory in-memory store — Product-shaped records for SmartStock frontend.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-07
 */

import { randomUUID } from 'node:crypto';

export type ProductCategory = 'glass' | 'aluminum';
export type ProductStatus = 'active' | 'discontinued';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  stock: number;
  price: number;
  threshold: number;
  status: ProductStatus;
  description?: string;
  sku: string;
}

export interface ProductCreateInput {
  name: string;
  category: ProductCategory;
  unit: string;
  stock: number;
  price: number;
  threshold: number;
  status?: ProductStatus;
  description?: string;
  sku: string;
}

export type ProductUpdateInput = Partial<ProductCreateInput>;

const products = new Map<string, Product>();
const bySku = new Map<string, string>();

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

function toRecord(input: ProductCreateInput): Product {
  return {
    id: randomUUID(),
    name: input.name.trim(),
    category: input.category,
    unit: input.unit.trim(),
    stock: input.stock,
    price: input.price,
    threshold: input.threshold,
    status: input.status ?? 'active',
    description: input.description?.trim() || undefined,
    sku: normalizeSku(input.sku),
  };
}

export function listProducts(): Product[] {
  return [...products.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function findProductById(id: string): Product | null {
  return products.get(id) ?? null;
}

export function createProduct(input: ProductCreateInput): Product {
  const sku = normalizeSku(input.sku);
  if (bySku.has(sku)) throw new Error('sku already exists');
  const record = toRecord({ ...input, sku });
  products.set(record.id, record);
  bySku.set(record.sku, record.id);
  return record;
}

export function updateProduct(id: string, input: ProductUpdateInput): Product | null {
  const current = products.get(id);
  if (!current) return null;

  const nextSku = input.sku === undefined ? current.sku : normalizeSku(input.sku);
  const existingId = bySku.get(nextSku);
  if (existingId && existingId !== id) throw new Error('sku already exists');

  const next: Product = {
    ...current,
    name: input.name === undefined ? current.name : input.name.trim(),
    category: input.category ?? current.category,
    unit: input.unit === undefined ? current.unit : input.unit.trim(),
    stock: input.stock ?? current.stock,
    price: input.price ?? current.price,
    threshold: input.threshold ?? current.threshold,
    status: input.status ?? current.status,
    description: input.description === undefined ? current.description : input.description.trim() || undefined,
    sku: nextSku,
  };

  if (next.sku !== current.sku) {
    bySku.delete(current.sku);
    bySku.set(next.sku, id);
  }
  products.set(id, next);
  return next;
}

export function deleteProduct(id: string): boolean {
  const current = products.get(id);
  if (!current) return false;
  products.delete(id);
  bySku.delete(current.sku);
  return true;
}

export function _resetInventoryStore(seed = true): void {
  products.clear();
  bySku.clear();
  if (!seed) return;
  for (const item of [
    { sku: 'GLS-CLR-6MM', name: 'Clear Glass 6mm', category: 'glass' as const, unit: 'sheet', stock: 24, price: 1200, threshold: 8, description: 'Standard clear glass sheet' },
    { sku: 'ALU-FRM-BLK', name: 'Black Aluminum Frame', category: 'aluminum' as const, unit: 'length', stock: 7, price: 850, threshold: 10, description: 'Powder-coated aluminum frame' },
    { sku: 'GLS-TMP-10MM', name: 'Tempered Glass 10mm', category: 'glass' as const, unit: 'sheet', stock: 0, price: 2200, threshold: 6, description: 'Heavy-duty tempered glass panel' },
  ]) {
    createProduct(item);
  }
}

_resetInventoryStore();
