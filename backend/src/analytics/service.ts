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
  classifyMovement,
  simpleExponentialSmoothingForecast,
} from './analytics.js';

function listAllMovements() {
  return listProducts().flatMap((product) => listProductMovements(product.id) ?? []);
}

export function getSalesTrends() {
  return buildMonthlySalesTrend(listOrders());
}

export function getAnnualPurchases(year = new Date().getUTCFullYear()) {
  return buildAnnualPurchaseSummary(listAllMovements(), listProducts(), year);
}

export function getMovementClassification(threshold = 10) {
  return classifyMovement(buildMonthlyOutboundQuantities(listAllMovements()), threshold);
}

export function getForecast(quantities: number[], alpha = 0.3) {
  return simpleExponentialSmoothingForecast(quantities, alpha);
}
