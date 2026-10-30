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

export type DashboardSalesRange = '6M' | '1Y' | 'ALL';

export interface RecentActivityRecord {
  id: string;
  kind: 'order_recorded' | 'stock_movement';
  occurredAt: string;
  referenceNumber: string;
  orderStatus?: Order['orderStatus'];
  customerName?: string;
  orderTotal?: number;
  movementType?: StockMovement['type'];
  productId?: string;
  productName?: string;
  unit?: string;
  quantity?: number;
}

export interface AnnualPurchaseSummaryRow {
  materialType: Product['category'] | 'unknown';
  supplier: string;
  transactionCount: number;
  totalQuantity: number;
  totalCost: number;
  unpricedReceiptCount: number;
  unpricedQuantity: number;
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

export function buildMonthlySalesTrend(
  orders: Order[],
  range?: DashboardSalesRange,
  now = new Date(),
): MonthlySalesTrendRow[] {
  const byMonth = new Map<string, MonthlySalesTrendRow>();
  for (const order of orders) {
    if (order.orderStatus === 'cancelled') continue;
    const month = monthKey(order.createdAt);
    const current = byMonth.get(month) ?? { month, transactionCount: 0, grossSales: 0 };
    current.transactionCount += 1;
    current.grossSales = roundTwo(current.grossSales + order.total);
    byMonth.set(month, current);
  }

  if (!range) return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));

  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const observedMonths = [...byMonth.keys()].filter((month) => month <= currentMonth.toISOString().slice(0, 7));
  if (range === 'ALL' && observedMonths.length === 0) return [];

  const monthCount = range === '6M' ? 6 : range === '1Y' ? 12 : undefined;
  const firstMonth = monthCount
    ? new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - monthCount + 1, 1))
    : new Date(`${observedMonths.sort()[0]}-01T00:00:00.000Z`);
  const rows: MonthlySalesTrendRow[] = [];
  const cursor = new Date(firstMonth);
  while (cursor <= currentMonth) {
    const month = cursor.toISOString().slice(0, 7);
    rows.push(byMonth.get(month) ?? { month, transactionCount: 0, grossSales: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return rows;
}

export function buildRecentActivity(
  orders: Order[],
  products: Product[],
  movements: StockMovement[],
  limit = 6,
): RecentActivityRecord[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error('limit must be an integer between 1 and 20');
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const activities: RecentActivityRecord[] = [];

  for (const order of orders) {
    if (!Number.isFinite(Date.parse(order.createdAt))) continue;
    activities.push({
      id: `order:${order.id}`,
      kind: 'order_recorded',
      occurredAt: order.createdAt,
      referenceNumber: order.referenceNumber,
      orderStatus: order.orderStatus,
      customerName: order.customerName,
      orderTotal: order.total,
    });
  }

  for (const movement of movements) {
    if (!Number.isFinite(Date.parse(movement.occurredAt))) continue;
    const product = productById.get(movement.productId);
    activities.push({
      id: `movement:${movement.id}`,
      kind: 'stock_movement',
      occurredAt: movement.occurredAt,
      referenceNumber: movement.referenceNo,
      movementType: movement.type,
      productId: movement.productId,
      productName: product?.name,
      unit: product?.unit,
      quantity: movement.quantity,
    });
  }

  return activities
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || a.id.localeCompare(b.id))
    .slice(0, limit);
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
      unpricedReceiptCount: 0,
      unpricedQuantity: 0,
    };
    current.transactionCount += 1;
    current.totalQuantity += movement.quantity;
    if (movement.unitCost === undefined) {
      current.unpricedReceiptCount += 1;
      current.unpricedQuantity += movement.quantity;
    } else {
      current.totalCost = roundTwo(current.totalCost + movement.quantity * movement.unitCost);
    }
    byGroup.set(key, current);
  }

  return [...byGroup.values()].sort((a, b) => (
    a.materialType.localeCompare(b.materialType) || a.supplier.localeCompare(b.supplier)
  ));
}

export interface AnnualPurchaseCursor {
  materialType: string;
  supplier: string;
}

export function paginateAnnualPurchaseSummary(
  rows: AnnualPurchaseSummaryRow[],
  limit: number,
  cursor: AnnualPurchaseCursor | null,
) {
  const compare = (left: string, right: string) => left.localeCompare(right);
  const filtered = cursor
    ? rows.filter((row) => compare(row.materialType, cursor.materialType) > 0
      || (row.materialType === cursor.materialType && compare(row.supplier, cursor.supplier) > 0))
    : rows;
  const selected = filtered.slice(0, limit + 1);
  const hasMore = selected.length > limit;
  const pageRows = selected.slice(0, limit);
  const last = pageRows.at(-1);
  return {
    rows: pageRows,
    page: {
      limit,
      totalCount: rows.length,
      hasMore,
      nextCursor: hasMore && last ? { materialType: last.materialType, supplier: last.supplier } : null,
    },
  };
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

export type PolicyAssessment = 'below_reorder_point' | 'below_forecast' | 'adequate' | 'insufficient_history';
export interface DemandForecastProduct {
  productId: string; sku: string; name: string; category: Product['category']; unit: string;
  currentStock: number; reorderPoint: number; history: MonthlyQuantity[]; positiveMonths: number;
  forecastQuantity: number | null; status: 'available' | 'insufficient_history';
  stockCoverageDays: number | null; recommendedOrderQuantity: number | null;
  policyAssessment: PolicyAssessment;
}
export interface DemandForecastReport {
  method: 'simple_exponential_smoothing'; alpha: number; horizonMonths: 1; minimumPositiveMonths: 3;
  generatedAt: string; historyMonths: number; assumption: string;
  products: DemandForecastProduct[];
  summary: { productCount: number; availableForecasts: number; insufficientHistory: number;
    belowReorderPoint: number; recommendedOrderQuantity: number };
}

function completeMonthKeys(now: Date, count: number): string[] {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - count + index, 1));
    return month.toISOString().slice(0, 7);
  });
}

export function buildDemandForecast(orders: Order[], products: Product[], historyMonths = 12, now = new Date()): DemandForecastReport {
  if (!Number.isInteger(historyMonths) || historyMonths < 1 || historyMonths > 60) throw new Error('historyMonths must be an integer between 1 and 60');
  const months = completeMonthKeys(now, historyMonths);
  const quantities = new Map<string, Map<string, number>>();
  for (const product of products) quantities.set(product.id, new Map(months.map((month) => [month, 0])));
  for (const order of orders) {
    if (order.orderStatus !== 'delivered') continue;
    const month = monthKey(order.createdAt);
    if (!months.includes(month)) continue;
    for (const item of order.items) {
      const byMonth = quantities.get(item.productId);
      if (byMonth?.has(month)) byMonth.set(month, (byMonth.get(month) ?? 0) + item.quantity);
    }
  }
  const reportProducts = products.map((product): DemandForecastProduct => {
    const history = months.map((month) => ({ month, quantity: quantities.get(product.id)?.get(month) ?? 0 }));
    const positiveMonths = history.filter((row) => row.quantity > 0).length;
    const available = positiveMonths >= 3;
    const forecastQuantity = available ? simpleExponentialSmoothingForecast(history.map((row) => row.quantity)).forecast : null;
    const coverage = forecastQuantity !== null && forecastQuantity > 0 ? Math.round(product.stock / forecastQuantity * 30) : null;
    const recommended = forecastQuantity === null ? null : Math.max(0, Math.ceil(forecastQuantity + product.threshold - product.stock));
    const policyAssessment: PolicyAssessment = !available ? 'insufficient_history'
      : product.stock <= product.threshold ? 'below_reorder_point'
      : product.stock < (forecastQuantity ?? 0) ? 'below_forecast' : 'adequate';
    return { productId: product.id, sku: product.sku, name: product.name, category: product.category, unit: product.unit,
      currentStock: product.stock, reorderPoint: product.threshold, history, positiveMonths, forecastQuantity,
      status: available ? 'available' : 'insufficient_history', stockCoverageDays: coverage,
      recommendedOrderQuantity: recommended, policyAssessment };
  });
  return {
    method: 'simple_exponential_smoothing', alpha: 0.3, horizonMonths: 1, minimumPositiveMonths: 3,
    generatedAt: now.toISOString(), historyMonths, assumption: 'Current-policy assessment only; suggested order quantity targets one forecast month plus the current reorder point. No historical stockout, lead-time, or holding-cost effects are inferred.',
    products: reportProducts,
    summary: { productCount: products.length, availableForecasts: reportProducts.filter((p) => p.status === 'available').length,
      insufficientHistory: reportProducts.filter((p) => p.status === 'insufficient_history').length,
      belowReorderPoint: reportProducts.filter((p) => p.policyAssessment === 'below_reorder_point').length,
      recommendedOrderQuantity: reportProducts.reduce((sum, p) => sum + (p.recommendedOrderQuantity ?? 0), 0) },
  };
}

export interface DemandForecastCursor { name: string; productId: string }

export function paginateDemandForecast(report: DemandForecastReport, limit: number, cursor: DemandForecastCursor | null = null) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be an integer between 1 and 100');
  const compare = (left: DemandForecastProduct, right: DemandForecastProduct) => {
    if (left.name !== right.name) return left.name < right.name ? -1 : 1;
    if (left.productId === right.productId) return 0;
    return left.productId < right.productId ? -1 : 1;
  };
  const available = report.products.filter((product) => product.forecastQuantity !== null).sort(compare);
  const afterCursor = cursor
    ? available.filter((product) => product.name > cursor.name
      || (product.name === cursor.name && product.productId > cursor.productId))
    : available;
  const lookahead = afterCursor.slice(0, limit + 1);
  const products = lookahead.slice(0, limit);
  const hasMore = lookahead.length > limit;
  const last = products[products.length - 1];
  return {
    ...report,
    products,
    page: {
      limit,
      totalCount: available.length,
      hasMore,
      nextCursor: hasMore && last ? { name: last.name, productId: last.productId } : null,
    },
  };
}
