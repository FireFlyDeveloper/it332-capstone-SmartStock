/**
 * AI insights — aggregate analytics interpretation with local fallback.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { getAnalyticsOrderSummary, getInsightAnnualMaterialSummary, getInsightInventorySummary, getInsightMovementSummary, projectInsightOrderRankings, getInsightPurchaseSummary, getMonthlyItemMovementPage, getMonthlyStockMovementByUnit, getDemandForecastPage } from '../analytics/service.js';
import type { SalesDirection } from './types.js';
import { getHermesConfig } from './config.js';
import { callHermesInsight } from './hermes.js';
import { INSIGHT_SECTION_KEYS, type AiInsight, type AiInsightContent, type InsightInterpretations, type InsightRequestOptions, type SafeInsightPayload } from './types.js';

const INSIGHT_HISTORY_MONTHS = 12;
const FORECAST_PAGE_SIZE = 100;
const MAX_UNIT_GROUPS = 25;

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateBoundary(value: string | undefined, endExclusive = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (endExclusive) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function summarizeTrend(rows: Array<{ sales: number }>): SafeInsightPayload['sales']['trend'] {
  if (rows.length < 2) {
    const onlyBucketSales = roundTwo(rows[0]?.sales ?? 0);
    return {
      direction: onlyBucketSales > 0 ? 'insufficient_data' : 'no_sales',
      changePercent: null,
      previousSales: 0,
      recentSales: onlyBucketSales,
    };
  }
  const previousSales = roundTwo(rows.at(-2)?.sales ?? 0);
  const recentSales = roundTwo(rows.at(-1)?.sales ?? 0);
  let direction: SalesDirection;
  if (!previousSales && !recentSales) direction = 'no_sales';
  else if (!previousSales) direction = 'new_activity';
  else if (recentSales > previousSales) direction = 'rising';
  else if (recentSales < previousSales) direction = 'falling';
  else direction = 'steady';
  return { direction, changePercent: previousSales ? roundTwo((recentSales - previousSales) / previousSales * 100) : null, previousSales, recentSales };
}

async function buildSafeDemandForecast(now: Date): Promise<SafeInsightPayload['forecast']> {
  const estimatesByUnit = new Map<string, number>();
  const recommendedOrderByUnit = new Map<string, number>();
  let summary: { productCount: number; availableForecasts: number; insufficientHistory: number } | null = null;
  let belowReorderPoint = 0;
  let cursor: { name: string; productId: string } | null = null;
  let pages = 0;

  while (true) {
    pages += 1;
    if (pages > 1000) throw new Error('Demand-forecast pagination exceeded its safety limit');
    const report = await getDemandForecastPage(INSIGHT_HISTORY_MONTHS, FORECAST_PAGE_SIZE, cursor, now);
    summary ??= report.summary;
    for (const product of report.products) {
      if (product.policyAssessment === 'below_reorder_point') belowReorderPoint += 1;
      if (product.forecastQuantity === null) continue;
      const unit = product.unit.trim() || 'unknown';
      estimatesByUnit.set(unit, (estimatesByUnit.get(unit) ?? 0) + product.forecastQuantity);
      recommendedOrderByUnit.set(unit, (recommendedOrderByUnit.get(unit) ?? 0) + (product.recommendedOrderQuantity ?? 0));
    }
    if (!report.page.hasMore) break;
    if (!report.page.nextCursor) throw new Error('Demand-forecast page is missing its next cursor');
    cursor = report.page.nextCursor;
  }

  const totals = summary ?? { productCount: 0, availableForecasts: 0, insufficientHistory: 0 };
  return {
    targetPeriod: 'next month',
    productsWithEstimate: totals.availableForecasts,
    totalProducts: totals.productCount,
    productsWithoutEstimate: totals.insufficientHistory,
    estimatesByUnit: [...estimatesByUnit.entries()]
      .map(([unit, quantity]) => ({ unit, quantity: roundTwo(quantity) }))
      .sort((left, right) => left.unit.localeCompare(right.unit)).slice(0, MAX_UNIT_GROUPS),
    belowReorderPoint,
    recommendedOrderByUnit: [...recommendedOrderByUnit.entries()].map(([unit, quantity]) => ({ unit, quantity: roundTwo(quantity) })).sort((a, b) => a.unit.localeCompare(b.unit)).slice(0, MAX_UNIT_GROUPS),
    omittedUnitGroups: Math.max(0, Math.max(estimatesByUnit.size, recommendedOrderByUnit.size) - MAX_UNIT_GROUPS),
  };
}

export async function buildSafeInsightPayload(options: InsightRequestOptions = {}, now = new Date()): Promise<SafeInsightPayload> {
  const movementMonth = options.movementMonth ?? now.toISOString().slice(0, 7);
  const startAt = dateBoundary(options.fromDate);
  const endAt = dateBoundary(options.toDate, true);
  const year = now.getUTCFullYear();
  const annualStart = new Date(Date.UTC(year, 0, 1));
  const annualEnd = now;
  const [salesAnalytics, purchases, selectedMovement, monthly, inventory, classification, forecast, annual] = await Promise.all([
    getAnalyticsOrderSummary(options.fromDate, options.toDate),
    getInsightPurchaseSummary(startAt, endAt),
    getInsightMovementSummary(startAt, endAt),
    getMonthlyStockMovementByUnit(INSIGHT_HISTORY_MONTHS, now),
    getInsightInventorySummary(),
    getMonthlyItemMovementPage(movementMonth, options.threshold ?? 10, 1, null),
    buildSafeDemandForecast(now),
    getInsightAnnualMaterialSummary(annualStart, annualEnd),
  ]);
  const rankings = projectInsightOrderRankings(salesAnalytics);
  const trendRows = salesAnalytics.salesTrendData;
  const salesWithMonthly = salesAnalytics as typeof salesAnalytics & {
    monthlySalesTrendData?: Array<{ month: string; transactionCount: number; grossSales: number }>;
    monthlySalesWindow?: { startMonth: string | null; endMonth: string | null; includedMonths: number; omittedMonths: number };
  };
  const legacyMonthly = salesAnalytics.deliveryDateMonthlySeries;
  const monthlySalesRows = salesWithMonthly.monthlySalesTrendData
    ?? legacyMonthly.months.map((row) => ({ month: row.month, transactionCount: row.orderCount, grossSales: row.grossSales }));
  const salesWindow = salesWithMonthly.monthlySalesWindow ?? {
    startMonth: legacyMonthly.months[0]?.month ?? null,
    endMonth: legacyMonthly.months.at(-1)?.month ?? null,
    includedMonths: legacyMonthly.months.length,
    omittedMonths: legacyMonthly.omittedMonthCount,
  };
  const materialUnitGroups = [...annual.quantityByCategoryAndUnit].sort((a, b) => a.unit.localeCompare(b.unit) || a.category.localeCompare(b.category));
  const selectedUnitRows = selectedMovement.slice(0, MAX_UNIT_GROUPS);
  let monthlyOmittedUnitGroups = 0;
  const safeRankGroups = (groups: typeof rankings.selectedRangeTopByUnit) => groups.slice(0, 5).map((group) => ({
    unit: group.unit,
    items: group.items.slice(0, 5).map((item) => ({ label: item.label, category: item.category, unit: group.unit,
      orderedQuantity: roundTwo(item.orderedQuantity), currentStock: roundTwo(item.currentStock), stockStatus: item.stockStatus })),
  }));
  return {
    sales: { period: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null }, orderCount: salesAnalytics.totalOrderCount,
      averageOrderValue: roundTwo(salesAnalytics.averageOrderValue), grossSales: roundTwo(trendRows.reduce((sum, row) => sum + row.sales, 0)),
      bucketsWithSales: trendRows.filter((row) => row.sales > 0).length, trend: summarizeTrend(trendRows) },
    purchases: { period: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null },
      recordedCost: roundTwo(purchases.recordedCost), pricedReceipts: purchases.pricedReceipts, unpricedReceipts: purchases.unpricedReceipts },
    movement: {
      selectedPeriod: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null, basis: startAt || endAt ? 'occurredAt_utc' : 'all_time' },
      selectedTotalsByUnit: selectedUnitRows.map((row) => ({ unit: row.unit, inbound: roundTwo(row.inboundQuantity), outbound: roundTwo(row.outboundQuantity), inboundCount: row.inboundCount, outboundCount: row.outboundCount })),
      selectedOmittedUnitGroups: Math.max(0, selectedMovement.length - MAX_UNIT_GROUPS),
      monthlyWindow: { startMonth: monthly.period.startMonth, endMonth: monthly.period.endMonth,
        months: monthly.months.map((month) => {
          const unitRows = monthly.rows.filter((row) => row.month === month);
          monthlyOmittedUnitGroups += Math.max(0, unitRows.length - MAX_UNIT_GROUPS);
          return { month, byUnit: unitRows.slice(0, MAX_UNIT_GROUPS).map((row) => ({
          unit: row.unit, inbound: roundTwo(row.inboundQuantity), outbound: roundTwo(row.outboundQuantity),
          })) };
        }) },
      monthlyOmittedUnitGroups,
      classification: { month: movementMonth, threshold: options.threshold ?? 10, productCount: classification.summary.productCount,
        fastMovingCount: classification.summary.fastMovingCount, slowMovingCount: classification.summary.slowMovingCount },
    },
    inventory: { ...inventory, glassInventoryValue: roundTwo(inventory.glassInventoryValue), aluminumInventoryValue: roundTwo(inventory.aluminumInventoryValue) }, forecast,
    monthlySales: {
      period: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null },
      rangeTotals: { orderRecords: salesAnalytics.totalOrderCount, grossOrderValue: roundTwo(trendRows.reduce((sum, row) => sum + row.sales, 0)), averageGrossOrderValue: roundTwo(salesAnalytics.averageOrderValue) },
      monthlyWindow: { startMonth: salesWindow.startMonth ?? null, endMonth: salesWindow.endMonth ?? null, includedMonths: salesWindow.includedMonths, omittedMonths: salesWindow.omittedMonths },
      byMonth: monthlySalesRows.slice(-12).map((row) => ({ month: row.month, orderRecords: row.transactionCount, grossOrderValue: roundTwo(row.grossSales) })),
    },
    annualMaterials: {
      year, periodBasis: 'occurredAt_utc_calendar_year_to_date',
      byCategory: annual.byCategory.map((row) => ({ category: row.category, recordedCost: roundTwo(row.recordedCost), pricedReceipts: row.pricedReceipts, unpricedReceipts: row.unpricedReceipts })),
      quantityByCategoryAndUnit: materialUnitGroups.slice(0, MAX_UNIT_GROUPS).map((row) => ({ category: row.category, unit: row.unit, quantity: roundTwo(row.quantity) })),
      omittedUnitGroups: Math.max(0, materialUnitGroups.length - MAX_UNIT_GROUPS),
    },
    orderRankings: {
      selectedRangeTopByUnit: safeRankGroups(rankings.selectedRangeTopByUnit),
      allTimeMostByUnit: safeRankGroups(rankings.allTimeMostByUnit),
      allTimeFewestByUnit: safeRankGroups(rankings.allTimeFewestByUnit),
      omittedUnitGroups: rankings.omittedUnitGroups,
    },
  };
}

function formatUnitTotals(rows: Array<{ unit: string; quantity: number }>): string {
  return rows.length ? rows.map((row) => `${roundTwo(row.quantity)} ${row.unit}`).join(' and ') : 'no unit-specific estimate is available';
}

export function generateFallbackInsight(payload: SafeInsightPayload): AiInsightContent {
  const { sales, purchases, movement, inventory, forecast } = payload;
  const trend = sales.trend;
  const direction = trend.direction;
  const salesLine = `The selected delivery-date range contains ${sales.orderCount} order records, ${sales.grossSales} in gross sales, and an average gross order value of ${sales.averageOrderValue}`;
  const trendSummary = direction === 'rising' || direction === 'falling'
    ? `latest-interval gross sales were ${Math.abs(trend.changePercent ?? 0)}% ${direction} than the previous interval`
    : direction === 'new_activity' ? 'gross sales started in the latest chart interval after none in the previous one'
      : direction === 'no_sales' ? 'no gross sales were recorded in the selected delivery-date range'
        : direction === 'steady' ? 'gross sales were unchanged between the latest chart intervals' : 'there is only one chart interval, so a sales trend cannot be compared';
  const classification = movement.classification;
  const cutoff = classification.threshold === 0 ? 'any recorded outbound movement' : `at least ${classification.threshold} ${classification.threshold === 1 ? 'unit' : 'units'} sent out`;
  const summary = `${salesLine}; ${trendSummary}. In ${classification.month}, ${classification.fastMovingCount} of ${classification.productCount} products met the fast-moving cutoff (${cutoff}) and ${classification.slowMovingCount} did not; next-month estimates total ${formatUnitTotals(forecast.estimatesByUnit)} for ${forecast.productsWithEstimate} of ${forecast.totalProducts} products.`;
  const selected = movement.selectedTotalsByUnit.map((row) => `${row.inbound} ${row.unit} received and ${row.outbound} ${row.unit} sent out`).join('; ') || 'no recorded movement';
  const monthlyTotals = new Map<string, { unit: string; inbound: number; outbound: number }>();
  for (const month of movement.monthlyWindow.months) {
    for (const row of month.byUnit) {
      const total = monthlyTotals.get(row.unit) ?? { unit: row.unit, inbound: 0, outbound: 0 };
      total.inbound += row.inbound;
      total.outbound += row.outbound;
      monthlyTotals.set(row.unit, total);
    }
  }
  const monthly = [...monthlyTotals.values()].map((row) => `${row.inbound} ${row.unit} received and ${row.outbound} ${row.unit} sent out`).join('; ') || 'no recorded movement';
  const receiptLabel = (count: number) => `${count} ${count === 1 ? 'receipt' : 'receipts'}`;
  const costRisk = purchases.unpricedReceipts > 0
    ? `Recorded purchase costs total ${purchases.recordedCost} across ${receiptLabel(purchases.pricedReceipts)} with a cost; ${purchases.unpricedReceipts} ${purchases.unpricedReceipts === 1 ? 'receipt has' : 'receipts have'} no cost recorded.`
    : purchases.pricedReceipts > 0
      ? `Recorded purchase costs total ${purchases.recordedCost} across ${receiptLabel(purchases.pricedReceipts)}.`
      : 'No purchase receipts were recorded in the selected period.';
  const movementPeriodLabel = movement.selectedPeriod.basis === 'all_time' ? 'all recorded history' : 'the selected event-date range';
  const salesByMonth = payload.monthlySales.byMonth;
  const annualMaterial = payload.annualMaterials;
  const rankingText = (groups: SafeInsightPayload['orderRankings']['allTimeMostByUnit'], empty: string, omitted: number) => {
    const listing = groups.length
      ? groups.map((group) => `${group.unit}: ${group.items.map((item) => `${item.label} (${item.orderedQuantity})`).join(', ')}`).join('; ')
      : empty;
    return omitted ? `${listing}; ${omitted} additional unit ${omitted === 1 ? 'group omitted' : 'groups omitted'} by the five-group limit` : listing;
  };
  const byMonthText = salesByMonth.length
    ? salesByMonth.map((row) => `${row.month}: ${row.orderRecords} records and ${row.grossOrderValue} gross`).join('; ')
    : 'no monthly order activity is available';
  const materialText = annualMaterial.byCategory.length
    ? annualMaterial.byCategory.map((row) => `${row.category}: ${row.recordedCost} recorded cost across ${row.pricedReceipts} priced and ${row.unpricedReceipts} unpriced receipts`).join('; ')
    : 'no annual purchase receipts are recorded';
  const quantityText = annualMaterial.quantityByCategoryAndUnit.length
    ? annualMaterial.quantityByCategoryAndUnit.map((row) => `${row.category}: ${row.quantity} ${row.unit}`).join('; ')
    : 'no inbound quantities are recorded';
  const activeAlerts = `${inventory.activeOutOfStockCount} out of stock, ${inventory.activeCriticalStockCount} critical, and ${inventory.activeLowAlertCount} low`;
  const interpretations: InsightInterpretations = {
    monthlySalesTransactions: `${byMonthText}. Gross value and transaction count describe different things; the monthly series shows ${payload.monthlySales.monthlyWindow.includedMonths} included months and omits ${payload.monthlySales.monthlyWindow.omittedMonths}.`,
    annualPurchasedMaterials: `${annualMaterial.year} UTC year-to-date inbound purchases: ${materialText}; quantities by category and unit: ${quantityText}. Unpriced receipt costs are not included.`,
    inventoryMovement: `For ${movementPeriodLabel}, ${selected}. In the monthly UTC movement window (current month to date), ${monthly}; keep inbound and outbound separate and do not infer individual-product demand from totals.`,
    demandForecast: `${forecast.productsWithEstimate} of ${forecast.totalProducts} products have enough recent history for an estimate; ${forecast.productsWithoutEstimate} do not. Missing history is unavailable, not zero demand; ${forecast.belowReorderPoint} estimated products are at or below their reorder point.`,
    orderRecordsPerMonth: `${byMonthText}. These monthly delivery-date record counts include cancelled orders.`,
    monthlyGrossOrderValue: `${salesByMonth.map((row) => `${row.month}: ${row.grossOrderValue}`).join('; ') || 'No monthly gross value is recorded'}. This is gross order value, not profit; cancelled orders are excluded, unpaid or partly paid orders are included, and refunds are not deducted.`,
    topOrderedProducts: `Selected delivery-date range, non-cancelled order quantities ranked within unit: ${rankingText(payload.orderRankings.selectedRangeTopByUnit, 'no ranked products', payload.orderRankings.omittedUnitGroups.selectedRangeTop)}.`,
    stockStatus: `Current stock status across ${inventory.productCount} non-deleted products: ${inventory.healthyStockCount} healthy, ${inventory.lowStockStatusCount} low, ${inventory.criticalStockCount} critical, and ${inventory.outOfStockCount} out of stock.`,
    stockAtListedPricesByCategory: `Current stock at listed selling prices is ${inventory.glassInventoryValue} for glass and ${inventory.aluminumInventoryValue} for aluminum (total ${inventory.totalInventoryValue}); this is not purchase cost or realized sales.`,
    mostOrderedProducts: `All-time non-cancelled order quantities, independent of the selected date range and ranked within unit: ${rankingText(payload.orderRankings.allTimeMostByUnit, 'no ranked products', payload.orderRankings.omittedUnitGroups.allTimeMost)}.`,
    fewestOrderedProducts: `All-time bottom-five products within each unit, including zero recorded orders: ${rankingText(payload.orderRankings.allTimeFewestByUnit, 'no ranked products', payload.orderRankings.omittedUnitGroups.allTimeFewest)}. Zero orders are not the same as unavailable history.`,
    salesEstimateNextMonth: `Next-month planning estimates total ${formatUnitTotals(forecast.estimatesByUnit)} for ${forecast.productsWithEstimate} of ${forecast.totalProducts} products; suggested restock quantities by unit are ${formatUnitTotals(forecast.recommendedOrderByUnit)}. These are estimates, not promised sales.`,
    stockAlerts: `Active-product alerts: ${activeAlerts}. Review out-of-stock and critical items first, then plan replenishment for low stock.`,
  };
  for (const key of INSIGHT_SECTION_KEYS) {
    if (!interpretations[key]) throw new Error(`Missing fallback interpretation: ${key}`);
    if (interpretations[key].length > 500) interpretations[key] = `${interpretations[key].slice(0, 497).trimEnd()}...`;
  }
  return {
    summary,
    interpretations,
    recommendations: [`Review products meeting the fast-moving cutoff for ${classification.month} before replenishing.`,
      'Check current inventory and keep different units separate.', `Use estimates as a guide; they cover ${forecast.productsWithEstimate} of ${forecast.totalProducts} products.`],
    risks: [costRisk, `Current inventory: ${inventory.productCount} products, ${inventory.activeProductCount} active, ${inventory.activeLowStockCount} active low-stock, ${inventory.criticalStockCount} critical, ${inventory.outOfStockCount} out of stock; listed value ${inventory.totalInventoryValue}. Movement in ${movementPeriodLabel}: ${selected}. Monthly chart totals (${movement.monthlyWindow.startMonth}–${movement.monthlyWindow.endMonth}): ${monthly}.`],
    confidence: sales.bucketsWithSales < 2 || forecast.productsWithEstimate === 0 ? 'low' : purchases.unpricedReceipts > 0 || forecast.productsWithoutEstimate > 0 ? 'medium' : 'high',
  };
}

export async function getAnalyticsInsight(options: InsightRequestOptions = {}, now = new Date()): Promise<AiInsight> {
  const payload = await buildSafeInsightPayload(options, now);
  const fallback = (): AiInsight => ({ ...generateFallbackInsight(payload), source: 'fallback' });
  const config = getHermesConfig();
  if (!config.apiKey || !config.baseUrl) return fallback();

  try {
    const ai = await callHermesInsight(payload, { apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model });
    return { ...ai, source: 'hermes' };
  } catch {
    return fallback();
  }
}
