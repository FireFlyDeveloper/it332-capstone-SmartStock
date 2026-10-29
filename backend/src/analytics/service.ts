/**
 * Analytics service — reads current in-memory SmartStock stores.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { listProducts, listProductMovements } from '../inventory/store.js';
import { listOrders } from '../orders/store.js';
import {
  buildAnnualPurchaseSummary,
  buildMonthlyOutboundQuantities,
  buildMonthlySalesTrend,
  buildRecentActivity,
  classifyMovement,
  simpleExponentialSmoothingForecast,
  buildDemandForecast,
  type DashboardSalesRange,
} from './analytics.js';

function listAllMovements() {
  return listProducts().flatMap((product) => listProductMovements(product.id) ?? []);
}

export function getSalesTrends(range?: DashboardSalesRange) {
  return buildMonthlySalesTrend(listOrders(), range);
}

export function getRecentActivity(limit = 6) {
  return buildRecentActivity(listOrders(), listProducts(), listAllMovements(), limit);
}

export function getAnnualPurchases(year = new Date().getUTCFullYear()) {
  return buildAnnualPurchaseSummary(listAllMovements(), listProducts(), year);
}

export function getMovementClassification(threshold = 10) {
  return classifyMovement(buildMonthlyOutboundQuantities(listAllMovements()), threshold);
}

export function getDemandForecast(historyMonths = 12, now = new Date()) {
  return buildDemandForecast(listOrders(), listProducts(), historyMonths, now);
}

export function getForecast(quantities: number[], alpha = 0.3) {
  return simpleExponentialSmoothingForecast(quantities, alpha);
}
