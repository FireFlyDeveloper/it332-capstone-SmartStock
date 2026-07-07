/**
 * Inventory in-memory store — product records and stock mutations.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-07
 */

import { randomUUID } from 'node:crypto';

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
  location?: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCreateInput {
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
  location?: string;
}

export type InventoryUpdateInput = Partial<InventoryCreateInput>;

const items = new Map<string, InventoryItem>();
const bySku = new Map<string, string>();

function now() {
  return new Date().toISOString();
}

function deriveStatus(quantity: number, reorderLevel: number): InventoryStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= reorderLevel) return 'low_stock';
  return 'in_stock';
}

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

function toRecord(input: InventoryCreateInput): InventoryItem {
  const timestamp = now();
  return {
    id: randomUUID(),
    sku: normalizeSku(input.sku),
    name: input.name.trim(),
    category: input.category.trim(),
    unit: input.unit.trim(),
    quantity: input.quantity,
    reorderLevel: input.reorderLevel,
    supplier: input.supplier?.trim() || undefined,
    location: input.location?.trim() || undefined,
    status: deriveStatus(input.quantity, input.reorderLevel),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function listInventory(): InventoryItem[] {
  return [...items.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function findInventoryById(id: string): InventoryItem | null {
  return items.get(id) ?? null;
}

export function findInventoryBySku(sku: string): InventoryItem | null {
  const id = bySku.get(normalizeSku(sku));
  return id ? findInventoryById(id) : null;
}

export function createInventory(input: InventoryCreateInput): InventoryItem {
  const sku = normalizeSku(input.sku);
  if (bySku.has(sku)) throw new Error('sku already exists');
  const record = toRecord({ ...input, sku });
  items.set(record.id, record);
  bySku.set(record.sku, record.id);
  return record;
}

export function updateInventory(id: string, input: InventoryUpdateInput): InventoryItem | null {
  const current = items.get(id);
  if (!current) return null;

  const nextSku = input.sku === undefined ? current.sku : normalizeSku(input.sku);
  const existingId = bySku.get(nextSku);
  if (existingId && existingId !== id) throw new Error('sku already exists');

  const next: InventoryItem = {
    ...current,
    sku: nextSku,
    name: input.name === undefined ? current.name : input.name.trim(),
    category: input.category === undefined ? current.category : input.category.trim(),
    unit: input.unit === undefined ? current.unit : input.unit.trim(),
    quantity: input.quantity ?? current.quantity,
    reorderLevel: input.reorderLevel ?? current.reorderLevel,
    supplier: input.supplier === undefined ? current.supplier : input.supplier.trim() || undefined,
    location: input.location === undefined ? current.location : input.location.trim() || undefined,
    updatedAt: now(),
    status: current.status,
  };
  next.status = deriveStatus(next.quantity, next.reorderLevel);

  if (next.sku !== current.sku) {
    bySku.delete(current.sku);
    bySku.set(next.sku, id);
  }
  items.set(id, next);
  return next;
}

export function deleteInventory(id: string): boolean {
  const current = items.get(id);
  if (!current) return false;
  items.delete(id);
  bySku.delete(current.sku);
  return true;
}

export function _resetInventoryStore(seed = true): void {
  items.clear();
  bySku.clear();
  if (!seed) return;
  for (const item of [
    { sku: 'GLS-CLR-6MM', name: 'Clear Glass 6mm', category: 'Glass Panels', unit: 'sheet', quantity: 24, reorderLevel: 8, supplier: 'Glassram', location: 'Rack A1' },
    { sku: 'ALU-FRM-BLK', name: 'Black Aluminum Frame', category: 'Aluminum', unit: 'length', quantity: 7, reorderLevel: 10, supplier: 'Glassram', location: 'Rack B2' },
    { sku: 'SEAL-SIL-CLR', name: 'Clear Silicone Sealant', category: 'Sealants', unit: 'tube', quantity: 0, reorderLevel: 12, supplier: 'Glassram', location: 'Cabinet C1' },
  ]) {
    createInventory(item);
  }
}

_resetInventoryStore();
