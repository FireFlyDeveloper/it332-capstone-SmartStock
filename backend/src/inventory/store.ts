/**
 * Inventory in-memory store — Product-shaped records for SmartStock frontend.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-07
 */

import { randomUUID } from 'node:crypto';
import { isDbSyncActive } from '../db/syncState.js';
import {
  createProductDb,
  updateProductDb,
  deleteProductDb,
  recordInboundStockDb,
  recordOutboundStockDb,
  listInventoryPolicyHistoryDb,
} from '../db/postgresStore.js';

export type InventoryPolicyEventType = 'baseline' | 'stock_changed' | 'threshold_changed' | 'stock_and_threshold_changed';
export interface InventoryPolicyEvent {
  id: string | number;
  productId: string;
  recordedAt: string;
  eventType: InventoryPolicyEventType;
  stockBefore: number | null;
  stockAfter: number;
  thresholdBefore: number | null;
  thresholdAfter: number;
}

const policyHistory: InventoryPolicyEvent[] = [];
let memoryEventId = 0;

export function recordInventoryPolicyEvent(productId: string, before: Pick<Product, 'stock' | 'threshold'> | null, after: Pick<Product, 'stock' | 'threshold'>): void {
  const stockChanged = before !== null && before.stock !== after.stock;
  const thresholdChanged = before !== null && before.threshold !== after.threshold;
  if (before && !stockChanged && !thresholdChanged) return;
  const eventType: InventoryPolicyEventType = !before
    ? 'baseline'
    : stockChanged && thresholdChanged ? 'stock_and_threshold_changed'
      : stockChanged ? 'stock_changed' : 'threshold_changed';
  policyHistory.push({
    id: `memory-${++memoryEventId}`,
    productId,
    recordedAt: new Date().toISOString(),
    eventType,
    stockBefore: before?.stock ?? null,
    stockAfter: after.stock,
    thresholdBefore: before?.threshold ?? null,
    thresholdAfter: after.threshold,
  });
}

export function listInventoryPolicyHistory(): InventoryPolicyEvent[] {
  return policyHistory.map((event) => ({ ...event })).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function resetInventoryPolicyHistory(): void {
  policyHistory.length = 0;
  memoryEventId = 0;
}

export function hydrateInventoryPolicyHistory(events: InventoryPolicyEvent[]): void {
  resetInventoryPolicyHistory();
  policyHistory.push(...events.map((event) => ({ ...event })));
}

export async function readInventoryPolicyHistory(): Promise<InventoryPolicyEvent[]> {
  return isDbSyncActive() ? listInventoryPolicyHistoryDb() : listInventoryPolicyHistory();
}

export type ProductCategory = 'glass' | 'aluminum';
export type ProductStatus = 'active' | 'discontinued';
export type StockMovementType = 'inbound' | 'outbound';

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

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceNo: string;
  supplier?: string;
  occurredAt: string;
  createdBy: string;
}

export interface StockMovementInput {
  quantity: number;
  unitCost?: number;
  referenceNo: string;
  supplier?: string;
  occurredAt?: string;
  createdBy?: string;
}

const products = new Map<string, Product>();
const bySku = new Map<string, string>();
const movements = new Map<string, StockMovement>();
const movementIdsByProduct = new Map<string, string[]>();
const movementRefs = new Map<string, string>();

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

function normalizeReference(referenceNo: string) {
  return referenceNo.trim().toUpperCase();
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

export function listLowStockProducts(): Product[] {
  return listProducts().filter((product) => product.stock <= product.threshold);
}

export function findProductById(id: string): Product | null {
  return products.get(id) ?? null;
}

export async function createProduct(input: ProductCreateInput): Promise<Product> {
  const sku = normalizeSku(input.sku);
  if (bySku.has(sku)) throw new Error('sku already exists');
  const record = toRecord({ ...input, sku });

  if (isDbSyncActive()) {
    const persisted = await createProductDb({ ...record, id: record.id });
    products.set(persisted.id, persisted);
    bySku.set(persisted.sku, persisted.id);
    return persisted;
  }

  products.set(record.id, record);
  bySku.set(record.sku, record.id);
  recordInventoryPolicyEvent(record.id, null, record);
  return record;
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<Product | null> {
  if (isDbSyncActive()) {
    const persisted = await updateProductDb(id, input);
    if (!persisted) return null;
    const cached = products.get(id);
    if (cached && persisted.sku !== cached.sku) bySku.delete(cached.sku);
    bySku.set(persisted.sku, id);
    products.set(id, persisted);
    return persisted;
  }

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
  recordInventoryPolicyEvent(id, current, next);
  return next;
}

function createMovement(productId: string, type: StockMovementType, input: StockMovementInput): StockMovement {
  const referenceNo = normalizeReference(input.referenceNo);
  if (movementRefs.has(referenceNo)) throw new Error('referenceNo already exists');

  return {
    id: randomUUID(),
    productId,
    type,
    quantity: input.quantity,
    ...(type === 'inbound' && input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
    referenceNo,
    supplier: input.supplier?.trim() || undefined,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    createdBy: input.createdBy?.trim() || 'system',
  };
}

function cacheMovement(movement: StockMovement): void {
  movements.set(movement.id, movement);
  movementRefs.set(movement.referenceNo, movement.id);
  movementIdsByProduct.set(movement.productId, [...(movementIdsByProduct.get(movement.productId) ?? []), movement.id]);
}

export async function recordInboundStock(productId: string, input: StockMovementInput): Promise<{ product: Product; movement: StockMovement } | null> {
  if (isDbSyncActive()) {
    const movement = createMovement(productId, 'inbound', input);
    const persisted = await recordInboundStockDb(productId, { ...input, id: movement.id });
    if (!persisted) return null;
    products.set(persisted.product.id, persisted.product);
    cacheMovement(persisted.movement);
    return persisted;
  }

  const current = products.get(productId);
  if (!current) return null;
  const movement = createMovement(productId, 'inbound', input);
  const product: Product = { ...current, stock: current.stock + input.quantity };
  products.set(productId, product);
  cacheMovement(movement);
  recordInventoryPolicyEvent(productId, current, product);
  return { product, movement };
}

export async function recordOutboundStock(productId: string, input: StockMovementInput): Promise<{ product: Product; movement: StockMovement } | null> {
  if (isDbSyncActive()) {
    const movement = createMovement(productId, 'outbound', input);
    const persisted = await recordOutboundStockDb(productId, { ...input, id: movement.id });
    if (!persisted) return null;
    products.set(persisted.product.id, persisted.product);
    cacheMovement(persisted.movement);
    return persisted;
  }

  const current = products.get(productId);
  if (!current) return null;
  if (current.stock < input.quantity) throw new Error('insufficient stock');
  const movement = createMovement(productId, 'outbound', input);
  const product: Product = { ...current, stock: current.stock - input.quantity };
  products.set(productId, product);
  cacheMovement(movement);
  recordInventoryPolicyEvent(productId, current, product);
  return { product, movement };
}

export function listProductMovements(productId: string): StockMovement[] | null {
  if (!products.has(productId)) return null;
  return (movementIdsByProduct.get(productId) ?? [])
    .map((id) => movements.get(id))
    .filter((movement): movement is StockMovement => Boolean(movement))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export async function deleteProduct(id: string): Promise<boolean> {
  const current = products.get(id);
  if (!isDbSyncActive() && !current) return false;

  if (isDbSyncActive()) {
    const deleted = await deleteProductDb(id);
    if (!deleted) return false;
  }

  products.delete(id);
  if (current) bySku.delete(current.sku);
  const productMovementIds = movementIdsByProduct.get(id) ?? [];
  for (const movementId of productMovementIds) {
    const movement = movements.get(movementId);
    if (movement) movementRefs.delete(movement.referenceNo);
    movements.delete(movementId);
  }
  movementIdsByProduct.delete(id);
  return true;
}

export function _hydrateInventory(loaded: Product[]): void {
  products.clear();
  bySku.clear();
  for (const item of loaded) {
    products.set(item.id, item);
    bySku.set(item.sku, item.id);
  }
}

export function _hydrateMovements(loaded: StockMovement[]): void {
  movements.clear();
  movementIdsByProduct.clear();
  movementRefs.clear();
  for (const m of loaded) {
    movements.set(m.id, m);
    movementRefs.set(m.referenceNo, m.id);
    movementIdsByProduct.set(m.productId, [...(movementIdsByProduct.get(m.productId) ?? []), m.id]);
  }
}

export function _applyPersistedOrderStock(product: Product, movement: StockMovement): void {
  const previous = products.get(product.id);
  if (previous && previous.sku !== product.sku) bySku.delete(previous.sku);
  products.set(product.id, product);
  bySku.set(product.sku, product.id);
  movements.set(movement.id, movement);
  movementRefs.set(movement.referenceNo, movement.id);
  movementIdsByProduct.set(product.id, [...(movementIdsByProduct.get(product.id) ?? []), movement.id]);
}

export function _resetInventoryStore(seed = true): void {
  products.clear();
  bySku.clear();
  movements.clear();
  movementIdsByProduct.clear();
  movementRefs.clear();
  resetInventoryPolicyHistory();
  if (!seed) return;
  const seedProducts: Array<[string, ProductCreateInput]> = [
    ['PRD-001', { sku: 'GLS-CLR-6MM', name: 'Clear Glass 6mm', category: 'glass', unit: 'sheet', stock: 24, price: 1250, threshold: 8, description: 'Standard clear glass sheet' }],
    ['PRD-002', { sku: 'ALU-FRM-BLK', name: 'Black Aluminum Frame', category: 'aluminum', unit: 'length', stock: 7, price: 900, threshold: 10, description: 'Powder-coated aluminum frame' }],
    ['PRD-003', { sku: 'GLS-TMP-10MM', name: 'Tempered Glass 10mm', category: 'glass', unit: 'sheet', stock: 0, price: 2200, threshold: 6, description: 'Heavy-duty tempered glass panel' }],
  ];
  for (const [id, input] of seedProducts) {
    const product = { ...toRecord(input), id };
    products.set(id, product);
    bySku.set(product.sku, id);
    recordInventoryPolicyEvent(id, null, product);
  }
}
