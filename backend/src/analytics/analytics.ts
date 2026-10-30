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

export interface AnalyticsOrderSummary {
  totalOrderCount: number;
  averageOrderValue: number;
  topSellingItems: Array<{ productId: string; name: string; quantity: number; category: string }>;
  mostOrderedItems: Array<{ name: string; category: string; stock: number; unitsOrdered: number; status: string }>;
  leastOrderedItems: Array<{ name: string; category: string; stock: number; unitsOrdered: number; status: string }>;
  orderedQuantities: Record<string, number>;
  salesTrendData: Array<{ month: string; sales: number; orders: number }>;
}

export function buildAnalyticsOrderSummary(orders: Order[], products: Product[], fromDate?: string, toDate?: string): AnalyticsOrderSummary {
  const filtered = orders.filter((order) => (!fromDate || order.deliveryDate >= fromDate) && (!toDate || order.deliveryDate <= toDate));
  const productById = new Map(products.map((product) => [product.id, product]));
  const rangedQuantities = new Map<string, { productId: string; name: string; quantity: number; category: string }>();
  const orderedQuantities: Record<string, number> = {};
  const countsByProduct = new Map<string, number>();
  let nonCancelledTotal = 0;
  let nonCancelledCount = 0;

  for (const order of filtered) {
    if (order.orderStatus !== 'cancelled') {
      nonCancelledTotal += order.total;
      nonCancelledCount += 1;
    }
    for (const line of order.items) {
      if (order.orderStatus === 'cancelled') continue;
      orderedQuantities[line.productId] = (orderedQuantities[line.productId] ?? 0) + line.quantity;
      const product = productById.get(line.productId);
      const current = rangedQuantities.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        quantity: 0,
        category: product?.category ?? 'Unclassified',
      };
      current.quantity += line.quantity;
      rangedQuantities.set(line.productId, current);
    }
  }

  for (const order of orders) {
    if (order.orderStatus === 'cancelled') continue;
    for (const line of order.items) countsByProduct.set(line.productId, (countsByProduct.get(line.productId) ?? 0) + line.quantity);
  }

  const topSellingItems = [...rangedQuantities.values()]
    .sort((left, right) => right.quantity - left.quantity || left.productId.localeCompare(right.productId))
    .slice(0, 5);
  const rankings = products.map((product) => ({
    name: product.name,
    category: product.category,
    stock: product.stock,
    unitsOrdered: countsByProduct.get(product.id) ?? 0,
    status: product.stock <= 0 ? 'out_of_stock' : product.stock <= product.threshold * 0.5 ? 'critical' : product.stock <= product.threshold ? 'low' : 'healthy',
  }));
  const mostOrderedItems = [...rankings].filter((product) => product.unitsOrdered > 0)
    .sort((left, right) => right.unitsOrdered - left.unitsOrdered || left.name.localeCompare(right.name)).slice(0, 5);
  const leastOrderedItems = [...rankings]
    .sort((left, right) => left.unitsOrdered - right.unitsOrdered || left.name.localeCompare(right.name)).slice(0, 5);

  const dates = filtered.map((order) => order.deliveryDate).filter(Boolean).sort();
  const useDayBuckets = dates.length > 0 && (Boolean(fromDate || toDate))
    && (new Date(`${dates[dates.length - 1]}T00:00:00.000Z`).getTime() - new Date(`${dates[0]}T00:00:00.000Z`).getTime()) / 86_400_000 <= 31;
  const trendBuckets = new Map<string, { month: string; sales: number; orders: number }>();
  for (const order of filtered) {
    const key = useDayBuckets ? order.deliveryDate : order.deliveryDate.slice(0, 7);
    if (!key) continue;
    const bucket = trendBuckets.get(key) ?? {
      month: useDayBuckets
        ? new Date(`${key}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        : new Date(`${key}-01T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      sales: 0,
      orders: 0,
    };
    if (order.orderStatus !== 'cancelled') bucket.sales += order.total;
    bucket.orders += 1;
    trendBuckets.set(key, bucket);
  }

  return {
    totalOrderCount: filtered.length,
    averageOrderValue: nonCancelledCount ? nonCancelledTotal / nonCancelledCount : 0,
    topSellingItems,
    mostOrderedItems,
    leastOrderedItems,
    orderedQuantities,
    salesTrendData: [...trendBuckets.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, row]) => row),
  };
}


export interface DashboardOrderSummary {
  activeOrderCount: number;
  orderStatusCounts: Array<{ status: Order['orderStatus']; count: number }>;
  topItems: Array<{
    productId: string;
    name: string;
    category: Product['category'] | null;
    unit: string | null;
    quantity: number;
  }>;
}

export function buildDashboardOrderSummary(orders: Order[], products: Product[]): DashboardOrderSummary {
  const statuses = new Map<Order['orderStatus'], number>();
  const productsById = new Map(products.map((product) => [product.id, product]));
  const items = new Map<string, DashboardOrderSummary['topItems'][number]>();
  let activeOrderCount = 0;

  for (const order of orders) {
    statuses.set(order.orderStatus, (statuses.get(order.orderStatus) ?? 0) + 1);
    if (order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled') activeOrderCount += 1;
    if (order.orderStatus === 'cancelled') continue;
    for (const line of order.items) {
      const product = productsById.get(line.productId);
      const current = items.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        category: product?.category ?? null,
        unit: product?.unit ?? null,
        quantity: 0,
      };
      current.quantity += line.quantity;
      items.set(line.productId, current);
    }
  }

  return {
    activeOrderCount,
    orderStatusCounts: [...statuses.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([status, count]) => ({ status, count })),
    topItems: [...items.values()]
      .sort((left, right) => right.quantity - left.quantity || left.productId.localeCompare(right.productId))
      .slice(0, 4),
  };
}

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

function comparePurchaseKey(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0)!);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0)!);
  const sharedLength = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < sharedLength; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
  }
  return leftPoints.length - rightPoints.length;
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
    comparePurchaseKey(a.materialType, b.materialType) || comparePurchaseKey(a.supplier, b.supplier)
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
  const compare = comparePurchaseKey;
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

export const DEMAND_FORECAST_ASSUMPTION = 'Current-policy assessment only; suggested order quantity targets one forecast month plus the current reorder point. No historical stockout, lead-time, or holding-cost effects are inferred.';

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
    generatedAt: now.toISOString(), historyMonths, assumption: DEMAND_FORECAST_ASSUMPTION,
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
