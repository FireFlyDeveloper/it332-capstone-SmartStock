/**
 * Analytics pure functions — deterministic reporting metrics.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import type { Order } from '../orders/store.js';
import type { Product, StockMovement } from '../inventory/store.js';

export interface MonthlySalesTrendRow {
  month: string;
  transactionCount: number;
  grossSales: number;
}

export interface AnnualPurchaseSummaryRow {
  materialType: Product['category'] | 'unknown';
  supplier: string;
  transactionCount: number;
  totalQuantity: number;
  totalCost: number;
}

export interface MonthlyQuantity {
  month: string;
  quantity: number;
}

export type MovementClassification = 'fast_moving' | 'slow_moving';

export interface MovementClassificationRow extends MonthlyQuantity {
  classification: MovementClassification;
}

export interface SesForecastResult {
  alpha: number;
  forecast: number;
}

function monthKey(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) throw new Error('invalid date');
  return date.toISOString().slice(0, 7);
}

function yearValue(isoDate: string): number {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) throw new Error('invalid date');
  return date.getUTCFullYear();
}

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildMonthlySalesTrend(orders: Order[]): MonthlySalesTrendRow[] {
  const byMonth = new Map<string, MonthlySalesTrendRow>();
  for (const order of orders) {
    if (order.orderStatus === 'cancelled') continue;
    const month = monthKey(order.createdAt);
    const current = byMonth.get(month) ?? { month, transactionCount: 0, grossSales: 0 };
    current.transactionCount += 1;
    current.grossSales = roundTwo(current.grossSales + order.total);
    byMonth.set(month, current);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function buildAnnualPurchaseSummary(
  movements: StockMovement[],
  products: Product[],
  year: number,
): AnnualPurchaseSummaryRow[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const byGroup = new Map<string, AnnualPurchaseSummaryRow>();

  for (const movement of movements) {
    if (movement.type !== 'inbound') continue;
    if (yearValue(movement.occurredAt) !== year) continue;

    const product = productById.get(movement.productId);
    const materialType = product?.category ?? 'unknown';
    const supplier = movement.supplier?.trim() || 'Unspecified';
    const key = materialType + '\u0000' + supplier;
    const current = byGroup.get(key) ?? {
      materialType,
      supplier,
      transactionCount: 0,
      totalQuantity: 0,
      totalCost: 0,
    };
    current.transactionCount += 1;
    current.totalQuantity += movement.quantity;
    current.totalCost = roundTwo(current.totalCost + movement.quantity * (product?.price ?? 0));
    byGroup.set(key, current);
  }

  return [...byGroup.values()].sort((a, b) => (
    a.materialType.localeCompare(b.materialType) || a.supplier.localeCompare(b.supplier)
  ));
}

export function buildMonthlyOutboundQuantities(movements: StockMovement[]): MonthlyQuantity[] {
  const byMonth = new Map<string, MonthlyQuantity>();
  for (const movement of movements) {
    if (movement.type !== 'outbound') continue;
    const month = monthKey(movement.occurredAt);
    const current = byMonth.get(month) ?? { month, quantity: 0 };
    current.quantity += movement.quantity;
    byMonth.set(month, current);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function classifyMovement(monthlyMovements: MonthlyQuantity[], threshold = 10): MovementClassificationRow[] {
  if (!Number.isFinite(threshold) || threshold < 0) throw new Error('threshold must be a non-negative number');
  return [...monthlyMovements]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((movement) => ({
      ...movement,
      classification: movement.quantity >= threshold ? 'fast_moving' : 'slow_moving',
    }));
}

export function simpleExponentialSmoothingForecast(quantities: number[], alpha = 0.3): SesForecastResult {
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha > 1) {
    throw new Error('alpha must be greater than 0 and less than or equal to 1');
  }
  if (!Array.isArray(quantities) || quantities.length === 0) throw new Error('quantities must not be empty');
  if (quantities.some((quantity) => !Number.isFinite(quantity))) throw new Error('quantities must be finite numbers');

  let forecast = quantities[0];
  for (let index = 1; index < quantities.length; index += 1) {
    forecast = alpha * quantities[index] + (1 - alpha) * forecast;
  }
  return { alpha, forecast: roundTwo(forecast) };
}
