/**
 * Analytics service — reads current in-memory SmartStock stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { isDbSyncActive } from '../db/syncState.js';
import { listAnnualPurchasesPageDb } from '../db/postgresStore.js';
import { listProducts, listProductMovements } from '../inventory/store.js';
import { listOrders } from '../orders/store.js';
import {
  buildAnnualPurchaseSummary,
  buildAnalyticsOrderSummary,
  buildDashboardOrderSummary,
  buildMonthlyOutboundQuantities,
  buildMonthlySalesTrend,
  buildRecentActivity,
  classifyMovement,
  simpleExponentialSmoothingForecast,
  buildDemandForecast,
  paginateDemandForecast,
  paginateAnnualPurchaseSummary,
  type AnnualPurchaseCursor,
  type DashboardSalesRange,
  type DemandForecastCursor,
} from './analytics.js';

function listAllMovements() {
  return listProducts().flatMap((product) => listProductMovements(product.id) ?? []);
}

export function getSalesTrends(range?: DashboardSalesRange) {
  return buildMonthlySalesTrend(listOrders(), range);
}

export function getDashboardOrderSummary() {
  return buildDashboardOrderSummary(listOrders(), listProducts());
}

export function getAnalyticsOrderSummary(fromDate?: string, toDate?: string) {
  return buildAnalyticsOrderSummary(listOrders(), listProducts(), fromDate, toDate);
}

export function getRecentActivity(limit = 6) {
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

export function getDemandForecast(historyMonths = 12, now = new Date()) {
  return buildDemandForecast(listOrders(), listProducts(), historyMonths, now);
}

export function getDemandForecastPage(historyMonths: number, limit: number, cursor: DemandForecastCursor | null) {
  return paginateDemandForecast(getDemandForecast(historyMonths), limit, cursor);
}

export function getForecast(quantities: number[], alpha = 0.3) {
  return simpleExponentialSmoothingForecast(quantities, alpha);
}
