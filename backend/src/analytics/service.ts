/**
 * Analytics service — reads current in-memory SmartStock stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { isDbSyncActive } from '../db/syncState.js';
import { getAnalyticsOrderSummaryDb, getDashboardOrderSummaryDb, listAnnualPurchasesPageDb, listDemandForecastPageDb, listItemMovementPageDb, listMonthlySalesTrendDb, listMonthlyStockMovementAggregatesDb, listOutboundMovementByUnitDb, listRecentActivityDb, listInsightMovementSummaryDb, listInsightPurchaseSummaryDb, listInsightYtdPurchaseSummaryDb, listInsightInventorySummaryDb } from '../db/postgresStore.js';
import { listProducts, listProductMovements } from '../inventory/store.js';
import { listOrders } from '../orders/store.js';
import { buildInventoryInsightSummary } from '../inventory/service.js';
import {
  buildAnnualPurchaseSummary,
  buildAnalyticsOrderSummary,
  buildYtdInboundPurchaseSummary,
  buildDashboardOrderSummary,
  buildMonthlyOutboundQuantities,
  buildMonthlyStockMovementByUnit,
  buildMonthlyStockMovementReport,
  buildOutboundMovementByUnit,
  buildMonthlySalesTrend,
  buildRecentActivity,
  classifyMovement,
  buildItemMovementClassification,
  paginateItemMovement,
  simpleExponentialSmoothingForecast,
  buildDemandForecast,
  DEMAND_FORECAST_ASSUMPTION,
  paginateDemandForecast,
  paginateAnnualPurchaseSummary,
  type AnnualPurchaseCursor,
  type AnalyticsOrderSummary,
  type DashboardSalesRange,
  type DemandForecastCursor,
  type ItemMovementCursor,
} from './analytics.js';

function listAllMovements() {
  return listProducts().flatMap((product) => listProductMovements(product.id) ?? []);
}

export async function getSalesTrends(range?: DashboardSalesRange, now = new Date()) {
  if (isDbSyncActive()) {
    const rows = await listMonthlySalesTrendDb(range, now);
    if (!rows) throw new Error('PostgreSQL is unavailable for monthly sales trends');
    return rows;
  }
  return buildMonthlySalesTrend(listOrders(), range, now);
}

export async function getDashboardOrderSummary() {
  if (isDbSyncActive()) {
    const summary = await getDashboardOrderSummaryDb();
    if (!summary) throw new Error('PostgreSQL is unavailable for dashboard order summary');
    return summary;
  }
  return buildDashboardOrderSummary(listOrders(), listProducts());
}

export async function getAnalyticsOrderSummary(fromDate?: string, toDate?: string) {
  if (isDbSyncActive()) {
    const summary = await getAnalyticsOrderSummaryDb(fromDate, toDate);
    if (!summary) throw new Error('PostgreSQL is unavailable for analytics order summary');
    return summary;
  }
  return buildAnalyticsOrderSummary(listOrders(), listProducts(), fromDate, toDate);
}

export async function getRecentActivity(limit = 6) {
  if (isDbSyncActive()) {
    const activity = await listRecentActivityDb(limit);
    if (!activity) throw new Error('PostgreSQL is unavailable for recent activity');
    return activity;
  }
  return buildRecentActivity(listOrders(), listProducts(), listAllMovements(), limit);
}

export function getAnnualPurchases(year = new Date().getUTCFullYear()) {
  return buildAnnualPurchaseSummary(listAllMovements(), listProducts(), year);
}

export async function getAnnualPurchasesPage(year: number, limit: number, cursor: AnnualPurchaseCursor | null) {
  if (isDbSyncActive()) {
    const page = await listAnnualPurchasesPageDb({ year, limit, cursor });
    if (!page) throw new Error('PostgreSQL is unavailable for annual purchase pagination');
    return { year, ...page };
  }

  const groups = getAnnualPurchases(year);
  const paginated = paginateAnnualPurchaseSummary(groups, limit, cursor);
  return {
    year,
    groups: paginated.rows,
    totalSpend: groups.reduce((sum, row) => sum + row.totalCost, 0),
    unpricedReceiptCount: groups.reduce((sum, row) => sum + row.unpricedReceiptCount, 0),
    unpricedQuantity: groups.reduce((sum, row) => sum + row.unpricedQuantity, 0),
    pricedReceiptCount: groups.reduce((sum, row) => sum + row.transactionCount - row.unpricedReceiptCount, 0),
    page: paginated.page,
  };
}

export function getMovementClassification(threshold = 10) {
  return classifyMovement(buildMonthlyOutboundQuantities(listAllMovements()), threshold);
}

export async function getOutboundMovementByUnit(startAt: Date, endAt: Date) {
  if (isDbSyncActive()) {
    const rows = await listOutboundMovementByUnitDb(startAt, endAt);
    if (!rows) throw new Error('PostgreSQL is unavailable for unit-separated outbound movement summary');
    return rows;
  }
  return buildOutboundMovementByUnit(listAllMovements(), listProducts(), startAt, endAt);
}

export async function getInsightMovementSummary(startAt?: Date, endAt?: Date) {
  if (isDbSyncActive()) {
    const rows = await listInsightMovementSummaryDb(startAt, endAt);
    if (!rows) throw new Error('PostgreSQL is unavailable for insight movement summary');
    return rows;
  }
  const products = new Map(listProducts().map((product) => [product.id, product]));
  const totals = new Map<string, { unit: string; inboundQuantity: number; outboundQuantity: number; inboundCount: number; outboundCount: number }>();
  for (const movement of listAllMovements()) {
    const at = Date.parse(movement.occurredAt);
    if (!Number.isFinite(at) || (startAt && at < startAt.getTime()) || (endAt && at >= endAt.getTime())) continue;
    const unit = products.get(movement.productId)?.unit?.trim() || 'unknown';
    const row = totals.get(unit) ?? { unit, inboundQuantity: 0, outboundQuantity: 0, inboundCount: 0, outboundCount: 0 };
    if (movement.type === 'inbound') { row.inboundQuantity += movement.quantity; row.inboundCount += 1; }
    else if (movement.type === 'outbound') { row.outboundQuantity += movement.quantity; row.outboundCount += 1; }
    totals.set(unit, row);
  }
  return [...totals.values()].sort((a, b) => a.unit.localeCompare(b.unit));
}

export async function getInsightPurchaseSummary(startAt?: Date, endAt?: Date) {
  if (isDbSyncActive()) {
    const summary = await listInsightPurchaseSummaryDb(startAt, endAt);
    if (!summary) throw new Error('PostgreSQL is unavailable for insight purchase summary');
    return summary;
  }
  const movements = listAllMovements().filter((movement) => {
    const at = Date.parse(movement.occurredAt);
    return movement.type === 'inbound' && Number.isFinite(at) && (!startAt || at >= startAt.getTime()) && (!endAt || at < endAt.getTime());
  });
  return {
    recordedCost: movements.reduce((sum, movement) => sum + (movement.unitCost === undefined ? 0 : movement.quantity * movement.unitCost), 0),
    pricedReceipts: movements.filter((movement) => movement.unitCost !== undefined).length,
    unpricedReceipts: movements.filter((movement) => movement.unitCost === undefined).length,
  };
}

export function projectInsightOrderRankings(summary: Pick<AnalyticsOrderSummary, 'aiProductRankings'>) {
  const grouped = summary.aiProductRankings;
  const convert = (groups: typeof grouped.allTime) => groups.map((group) => ({ unit: group.unit,
    items: group.items.map((item) => ({ label: item.name, category: item.category, orderedQuantity: item.quantity, currentStock: item.stock, stockStatus: item.status })) }));
  return {
    selectedRangeTopByUnit: convert(grouped.selectedRange),
    allTimeMostByUnit: convert(grouped.allTime),
    allTimeFewestByUnit: convert(grouped.allTimeFewest),
    omittedUnitGroups: { selectedRangeTop: grouped.omittedUnitGroups.selectedRange, allTimeMost: grouped.omittedUnitGroups.allTime, allTimeFewest: grouped.omittedUnitGroups.allTimeFewest },
  };
}

export async function getInsightAnnualMaterialSummary(startAt?: Date, endAt?: Date) {
  const now = endAt ?? new Date();
  const year = startAt?.getUTCFullYear() ?? now.getUTCFullYear();
  const summary = isDbSyncActive()
    ? await listInsightYtdPurchaseSummaryDb(year, now)
    : buildYtdInboundPurchaseSummary(listAllMovements(), listProducts(), now);
  if (!summary) throw new Error('PostgreSQL is unavailable for YTD inbound purchase summary');
  return {
    year: summary.year,
    byCategory: summary.categories.map((row) => ({ category: row.category, recordedCost: row.totalCost, pricedReceipts: row.pricedReceipts, unpricedReceipts: row.unpricedReceipts })),
    quantityByCategoryAndUnit: summary.categoryUnits.map((row) => ({ category: row.category, unit: row.unit, quantity: row.totalQuantity })),
  };
}

export async function getInsightInventorySummary() {
  if (isDbSyncActive()) {
    const summary = await listInsightInventorySummaryDb();
    if (!summary) throw new Error('PostgreSQL is unavailable for inventory summary');
    const value = (category: string) => summary.categoryValues.find((row) => row.category === category)?.listedPriceValue ?? 0;
    return { ...summary, glassInventoryValue: value('glass'), aluminumInventoryValue: value('aluminum'),
      activeOutOfStockCount: summary.activeAlertCounts.outOfStock, activeCriticalStockCount: summary.activeAlertCounts.critical,
      activeLowAlertCount: summary.activeAlertCounts.low };
  }
  return buildInventoryInsightSummary(listProducts());
}


export async function getMonthlyStockMovementByUnit(months = 12, now = new Date()) {
  if (!Number.isInteger(months) || months < 1 || months > 60) throw new Error('months must be an integer between 1 and 60');
  const endAt = new Date(now.getTime() + 1);
  const startAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));
  if (isDbSyncActive()) {
    const aggregates = await listMonthlyStockMovementAggregatesDb(startAt, endAt, now);
    if (!aggregates) throw new Error('PostgreSQL is unavailable for monthly stock movement');
    return buildMonthlyStockMovementReport(aggregates, startAt, endAt);
  }
  return buildMonthlyStockMovementByUnit(listAllMovements(), listProducts(), startAt, endAt, now);
}

function movementDateRangeBounds(fromDate?: string, toDate?: string) {
  const parse = (value: string | undefined, endExclusive = false): Date | null => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error('fromDate and toDate must be valid YYYY-MM-DD dates');
    }
    if (endExclusive) date.setUTCDate(date.getUTCDate() + 1);
    return date;
  };
  if (fromDate && toDate && fromDate > toDate) throw new Error('fromDate must be on or before toDate');
  return { startAt: parse(fromDate), endAt: parse(toDate, true) };
}

export async function getItemMovementPage(
  fromDate: string | undefined,
  toDate: string | undefined,
  threshold: number,
  limit: number,
  cursor: ItemMovementCursor | null,
) {
  const { startAt, endAt } = movementDateRangeBounds(fromDate, toDate);
  if (isDbSyncActive()) {
    const page = await listItemMovementPageDb({ startAt, endAt, threshold, limit, cursor });
    if (!page) throw new Error('PostgreSQL is unavailable for item movement');
    return { period: { fromDate: fromDate ?? null, toDate: toDate ?? null }, threshold, ...page };
  }
  const rows = buildItemMovementClassification(listAllMovements(), listProducts(), fromDate, toDate, threshold);
  return { period: { fromDate: fromDate ?? null, toDate: toDate ?? null }, threshold, ...paginateItemMovement(rows, limit, cursor) };
}

export function getDemandForecast(historyMonths = 12, now = new Date()) {
  return buildDemandForecast(listOrders(), listProducts(), historyMonths, now);
}

export async function getDemandForecastPage(historyMonths: number, limit: number, cursor: DemandForecastCursor | null, now = new Date()) {
  if (isDbSyncActive()) {
    const page = await listDemandForecastPageDb({ now, historyMonths, limit, cursor });
    if (!page) throw new Error('PostgreSQL is unavailable for demand-forecast pagination');
    return {
      method: 'simple_exponential_smoothing' as const,
      alpha: 0.3 as const,
      horizonMonths: 1 as const,
      minimumPositiveMonths: 3 as const,
      generatedAt: now.toISOString(),
      historyMonths,
      assumption: DEMAND_FORECAST_ASSUMPTION,
      products: page.products,
      summary: page.summary,
      page: page.page,
    };
  }
  return paginateDemandForecast(getDemandForecast(historyMonths, now), limit, cursor);
}

export function getForecast(quantities: number[], alpha = 0.3) {
  return simpleExponentialSmoothingForecast(quantities, alpha);
}
