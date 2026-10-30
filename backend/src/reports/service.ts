/**
 * Reports service — stable JSON report DTOs composed from analytics and stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { listOrders } from '../orders/store.js';
import { isDbSyncActive } from '../db/syncState.js';
import { getOrderSummaryReportDb, listPolicyPerformancePageDb } from '../db/postgresStore.js';
import { getAnnualPurchases, getSalesTrends, getDemandForecast } from '../analytics/service.js';
import { listProducts, readInventoryPolicyHistory, type InventoryPolicyEvent, type Product } from '../inventory/store.js';

function currentUtcYear() {
  return new Date().getUTCFullYear();
}

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function buildOrderSummaryReport(fromDate?: string, toDate?: string) {
  if (isDbSyncActive()) {
    const summary = await getOrderSummaryReportDb(fromDate, toDate);
    if (!summary) throw new Error('PostgreSQL is unavailable for reports order summary');
    return summary;
  }
  const orders = listOrders().filter((order) => (
    (!fromDate || order.deliveryDate >= fromDate) && (!toDate || order.deliveryDate <= toDate)
  ));
  const count = (predicate: (order: (typeof orders)[number]) => boolean) => orders.filter(predicate).length;
  const processingCount = count((order) => order.orderStatus === 'processing');
  const inTransitCount = count((order) => order.orderStatus === 'in_transit');
  const completedCount = count((order) => order.orderStatus === 'delivered');
  const cancelledCount = count((order) => order.orderStatus === 'cancelled');
  const pendingPaymentCount = count((order) => order.paymentStatus === 'unpaid');
  const partialPaymentCount = count((order) => order.paymentStatus === 'partial');
  const paidCount = count((order) => order.paymentStatus === 'paid');
  const refundedCount = count((order) => order.paymentStatus === 'refunded');

  return {
    totalOrders: orders.length,
    totalSales: roundTwo(orders.reduce((sum, order) => sum + (order.orderStatus === 'delivered' ? order.total : 0), 0)),
    completedCount,
    pendingOrders: processingCount + inTransitCount,
    statusCounts: {
      completed: completedCount,
      inProgress: processingCount + inTransitCount,
      pending: 0,
      cancelled: cancelledCount,
    },
    paymentCounts: {
      paid: paidCount,
      pending: pendingPaymentCount,
      partial: partialPaymentCount,
      refunded: refundedCount,
    },
  };
}

export async function buildMonthlySalesReport() {
  const rows = await getSalesTrends();
  return {
    report: 'monthly_sales' as const,
    totals: {
      months: rows.length,
      transactionCount: rows.reduce((sum, row) => sum + row.transactionCount, 0),
      grossSales: roundTwo(rows.reduce((sum, row) => sum + row.grossSales, 0)),
    },
    rows,
  };
}

export function buildAnnualPurchasesReport(year = currentUtcYear()) {
  const rows = getAnnualPurchases(year);
  return {
    report: 'annual_purchases' as const,
    year,
    totals: {
      groups: rows.length,
      transactionCount: rows.reduce((sum, row) => sum + row.transactionCount, 0),
      totalQuantity: rows.reduce((sum, row) => sum + row.totalQuantity, 0),
      totalCost: roundTwo(rows.reduce((sum, row) => sum + row.totalCost, 0)),
      unpricedReceiptCount: rows.reduce((sum, row) => sum + row.unpricedReceiptCount, 0),
      unpricedQuantity: rows.reduce((sum, row) => sum + row.unpricedQuantity, 0),
    },
    rows,
  };
}

function stockStatus(product: Product): 'low_stock' | 'healthy' {
  return product.stock <= product.threshold ? 'low_stock' : 'healthy';
}

export function buildInventoryEvaluationReport() {
  const rows = listProducts().map((product) => ({
    sku: product.sku,
    name: product.name,
    category: product.category,
    stock: product.stock,
    unit: product.unit,
    unitPrice: product.price,
    inventoryValue: roundTwo(product.stock * product.price),
    threshold: product.threshold,
    stockStatus: stockStatus(product),
  }));

  return {
    report: 'inventory_evaluation' as const,
    totals: {
      products: rows.length,
      totalStock: rows.reduce((sum, row) => sum + row.stock, 0),
      totalInventoryValue: roundTwo(rows.reduce((sum, row) => sum + row.inventoryValue, 0)),
      lowStockCount: rows.filter((row) => row.stockStatus === 'low_stock').length,
    },
    rows,
  };
}

export function buildSpendingReport(year = currentUtcYear()) {
  const purchaseRows = getAnnualPurchases(year);
  const totalSpend = roundTwo(purchaseRows.reduce((sum, row) => sum + row.totalCost, 0));
  const rows = purchaseRows.map((row) => ({
    materialType: row.materialType,
    supplier: row.supplier,
    totalSpend: row.totalCost,
    shareOfSpend: totalSpend === 0 ? 0 : roundTwo((row.totalCost / totalSpend) * 100),
  }));

  return {
    report: 'spending' as const,
    year,
    totals: {
      groups: rows.length,
      totalSpend,
      unpricedReceiptCount: purchaseRows.reduce((sum, row) => sum + row.unpricedReceiptCount, 0),
      unpricedQuantity: purchaseRows.reduce((sum, row) => sum + row.unpricedQuantity, 0),
    },
    rows: rows.map((row) => {
      const purchase = purchaseRows.find((item) => item.materialType === row.materialType && item.supplier === row.supplier);
      return { ...row, unpricedReceiptCount: purchase?.unpricedReceiptCount ?? 0, unpricedQuantity: purchase?.unpricedQuantity ?? 0 };
    }),
  };
}

export function buildDemandForecastReport() {
  const forecast = getDemandForecast();
  return {
    report: 'forecast' as const,
    method: forecast.method,
    alpha: forecast.alpha,
    horizonMonths: forecast.horizonMonths,
    minimumPositiveMonths: forecast.minimumPositiveMonths,
    generatedAt: forecast.generatedAt,
    historyMonths: forecast.historyMonths,
    assumption: forecast.assumption,
    totals: forecast.summary,
    rows: forecast.products.map((product) => ({ ...product, history: JSON.stringify(product.history) })),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function roundFour(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

const POLICY_PERFORMANCE_METHOD = 'Observed stock and reorder-point snapshots; intervals are time-weighted from each product baseline/event until the next event or report generation time.';
const POLICY_PERFORMANCE_ASSUMPTION = 'History starts at baseline/migration activation. No pre-activation history is backfilled. This report does not infer causal effects, missed demand, lead-time effects, or holding-cost effects.';

export async function buildPolicyPerformanceReport(now = new Date()) {
  const events = await readInventoryPolicyHistory();
  const products = listProducts();
  const byProduct = new Map<string, InventoryPolicyEvent[]>();
  for (const event of events) byProduct.set(event.productId, [...(byProduct.get(event.productId) ?? []), event]);
  const currentTime = now.getTime();
  const rows = products.map((product) => {
    const history = (byProduct.get(product.id) ?? []).slice().sort((a, b) =>
      Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || Number(a.id) - Number(b.id));
    const first = history[0];
    let weightedStock = 0;
    let trackedMs = 0;
    let atOrBelowMs = 0;
    let outOfStockMs = 0;
    let thresholdChanges = 0;
    for (let index = 0; index < history.length; index += 1) {
      const event = history[index];
      const eventTime = Math.min(currentTime, Date.parse(event.recordedAt));
      const nextTime = index + 1 < history.length ? Date.parse(history[index + 1].recordedAt) : currentTime;
      const endTime = Math.max(eventTime, Math.min(currentTime, nextTime));
      const interval = Math.max(0, endTime - eventTime);
      weightedStock += event.stockAfter * interval;
      trackedMs += interval;
      if (event.stockAfter <= event.thresholdAfter) atOrBelowMs += interval;
      if (event.stockAfter <= 0) outOfStockMs += interval;
      if (event.thresholdBefore !== null && event.thresholdBefore !== event.thresholdAfter) thresholdChanges += 1;
    }
    const trackingDays = trackedMs / DAY_MS;
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      trackingStartedAt: first?.recordedAt ?? null,
      trackingDays: roundFour(trackingDays),
      timeWeightedAverageOnHand: trackedMs > 0 ? roundFour(weightedStock / trackedMs) : null,
      daysAtOrBelowReorderPoint: roundFour(atOrBelowMs / DAY_MS),
      percentTimeAtOrBelowReorderPoint: trackedMs > 0 ? roundFour((atOrBelowMs / trackedMs) * 100) : null,
      outOfStockDays: roundFour(outOfStockMs / DAY_MS),
      reorderPointChanges: thresholdChanges,
      currentStock: product.stock,
      currentReorderPoint: product.threshold,
      status: product.stock <= product.threshold ? 'at_or_below_reorder_point' as const : 'above_reorder_point' as const,
    };
  });
  const populated = rows.filter((row) => row.trackingStartedAt !== null);
  const trackingStart = populated.map((row) => row.trackingStartedAt!).sort()[0] ?? null;
  return {
    report: 'policy_performance' as const,
    trackingStart,
    generatedAt: now.toISOString(),
    method: POLICY_PERFORMANCE_METHOD,
    assumption: POLICY_PERFORMANCE_ASSUMPTION,
    totals: {
      products: rows.length,
      productsWithHistory: populated.length,
      trackingDays: trackingStart ? roundFour(Math.max(0, (currentTime - Date.parse(trackingStart)) / DAY_MS)) : 0,
      outOfStockProductCount: rows.filter((row) => row.currentStock <= 0).length,
      reorderPointChanges: rows.reduce((sum, row) => sum + row.reorderPointChanges, 0),
    },
    rows,
  };
}

export interface PolicyPerformanceCursor {
  name: string;
  productId: string;
}

function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0)!);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0)!);
  const sharedLength = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < sharedLength; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
  }
  return leftPoints.length - rightPoints.length;
}

export function paginatePolicyPerformanceReport(
  report: Awaited<ReturnType<typeof buildPolicyPerformanceReport>>,
  limit: number,
  cursor: PolicyPerformanceCursor | null,
) {
  const compare = compareUnicodeCodePoints;
  const rows = [...report.rows].sort((a, b) => compare(a.name, b.name) || compare(a.productId, b.productId));
  const filtered = cursor
    ? rows.filter((row) => compare(row.name, cursor.name) > 0 || (row.name === cursor.name && compare(row.productId, cursor.productId) > 0))
    : rows;
  const selected = filtered.slice(0, limit + 1);
  const hasMore = selected.length > limit;
  const pageRows = selected.slice(0, limit);
  const last = pageRows.at(-1);
  const nextCursor = hasMore && last
    ? Buffer.from(JSON.stringify({ name: last.name, productId: last.productId })).toString('base64url')
    : null;
  return {
    ...report,
    rows: pageRows,
    page: { limit, totalCount: rows.length, hasMore, nextCursor },
  };
}

export async function buildPolicyPerformancePage(now: Date, limit: number, cursor: PolicyPerformanceCursor | null) {
  if (!isDbSyncActive()) return paginatePolicyPerformanceReport(await buildPolicyPerformanceReport(now), limit, cursor);

  const result = await listPolicyPerformancePageDb({ now, limit, cursor });
  if (!result) throw new Error('PostgreSQL is unavailable for policy-performance pagination');
  const nextCursor = result.page.nextCursor
    ? Buffer.from(JSON.stringify(result.page.nextCursor)).toString('base64url')
    : null;
  return {
    report: 'policy_performance' as const,
    trackingStart: result.trackingStart,
    generatedAt: now.toISOString(),
    method: POLICY_PERFORMANCE_METHOD,
    assumption: POLICY_PERFORMANCE_ASSUMPTION,
    totals: result.totals,
    rows: result.rows,
    page: { ...result.page, nextCursor },
  };
}

export type ReportDto =
  | Awaited<ReturnType<typeof buildMonthlySalesReport>>
  | ReturnType<typeof buildAnnualPurchasesReport>
  | ReturnType<typeof buildInventoryEvaluationReport>
  | ReturnType<typeof buildSpendingReport>
  | ReturnType<typeof buildDemandForecastReport>
  | Awaited<ReturnType<typeof buildPolicyPerformanceReport>>;
