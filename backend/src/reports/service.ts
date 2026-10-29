/**
 * Reports service — stable JSON report DTOs composed from analytics and stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { getAnnualPurchases, getSalesTrends, getDemandForecast } from '../analytics/service.js';
import { listProducts, readInventoryPolicyHistory, type InventoryPolicyEvent, type Product } from '../inventory/store.js';

function currentUtcYear() {
  return new Date().getUTCFullYear();
}

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildMonthlySalesReport() {
  const rows = getSalesTrends();
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
    method: 'Observed stock and reorder-point snapshots; intervals are time-weighted from each product baseline/event until the next event or report generation time.',
    assumption: 'History starts at baseline/migration activation. No pre-activation history is backfilled. This report does not infer causal effects, missed demand, lead-time effects, or holding-cost effects.',
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

export type ReportDto =
  | ReturnType<typeof buildMonthlySalesReport>
  | ReturnType<typeof buildAnnualPurchasesReport>
  | ReturnType<typeof buildInventoryEvaluationReport>
  | ReturnType<typeof buildSpendingReport>
  | ReturnType<typeof buildDemandForecastReport>
  | Awaited<ReturnType<typeof buildPolicyPerformanceReport>>;
