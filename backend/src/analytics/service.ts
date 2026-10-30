/**
 * Analytics service — reads current in-memory SmartStock stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { isDbSyncActive } from '../db/syncState.js';
import { getAnalyticsOrderSummaryDb, getDashboardOrderSummaryDb, listAnnualPurchasesPageDb, listDemandForecastPageDb, listMonthlySalesTrendDb, listOutboundMovementByUnitDb, listRecentActivityDb } from '../db/postgresStore.js';
import { listProducts, listProductMovements } from '../inventory/store.js';
import { listOrders } from '../orders/store.js';
import {
  buildAnnualPurchaseSummary,
  buildAnalyticsOrderSummary,
  buildDashboardOrderSummary,
  buildMonthlyOutboundQuantities,
  buildOutboundMovementByUnit,
  buildMonthlySalesTrend,
  buildRecentActivity,
  classifyMovement,
  buildMonthlyItemMovementClassification,
  paginateMonthlyItemMovement,
  simpleExponentialSmoothingForecast,
  buildDemandForecast,
  DEMAND_FORECAST_ASSUMPTION,
  paginateDemandForecast,
  paginateAnnualPurchaseSummary,
  type AnnualPurchaseCursor,
  type DashboardSalesRange,
  type DemandForecastCursor,
  type MonthlyItemMovementCursor,
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

export function getMonthlyItemMovementPage(
  month: string,
  threshold: number,
  limit: number,
  cursor: MonthlyItemMovementCursor | null,
) {
  const rows = buildMonthlyItemMovementClassification(listAllMovements(), listProducts(), month, threshold);
  return { month, threshold, ...paginateMonthlyItemMovement(rows, limit, cursor) };
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
