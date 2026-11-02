/**
 * AI insights — aggregate analytics interpreted by Hermes only.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { getAnalyticsOrderSummary, getInsightAnnualMaterialSummary, getInsightInventorySummary, getInsightMovementSummary, projectInsightOrderRankings, getInsightPurchaseSummary, getItemMovementPage, getMonthlyStockMovementByUnit, getDemandForecastPage } from '../analytics/service.js';
import { buildPolicyPerformanceReport } from '../reports/service.js';
import type { SalesDirection } from './types.js';
import { getHermesConfig } from './config.js';
import { callHermesInsight } from './hermes.js';
import { INSIGHT_SECTION_KEYS, type AiInsight, type InsightRequestOptions, type SafeInsightPayload } from './types.js';

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

function buildSafePolicyPerformance(
  report: Awaited<ReturnType<typeof buildPolicyPerformanceReport>>,
  fromDate?: string,
  toDate?: string,
): SafeInsightPayload['policyPerformance'] {
  const trackedRows = report.rows.filter((row) => row.trackingDays > 0);
  const trackedProductDays = trackedRows.reduce((sum, row) => sum + row.trackingDays, 0);
  const daysAtOrBelow = trackedRows.reduce((sum, row) => sum + row.daysAtOrBelowReorderPoint, 0);
  const outOfStockProductDays = trackedRows.reduce((sum, row) => sum + row.outOfStockDays, 0);
  const comparisons = report.rows.flatMap((row) => row.policyPeriods.slice(1).map((period, index) => ({
    productId: row.productId,
    unit: row.unit.trim() || 'unknown',
    previous: row.policyPeriods[index],
    current: period,
  })));
  const percentDeltas = comparisons.flatMap(({ previous, current }) => (
    previous.percentTimeAtOrBelowReorderPoint === null || current.percentTimeAtOrBelowReorderPoint === null
      ? [] : [current.percentTimeAtOrBelowReorderPoint - previous.percentTimeAtOrBelowReorderPoint]
  ));
  const outOfStockDeltas = comparisons.flatMap(({ previous, current }) => (
    previous.trackingDays <= 0 || current.trackingDays <= 0 ? [] : [
      (current.outOfStockDays / current.trackingDays * 30) - (previous.outOfStockDays / previous.trackingDays * 30),
    ]
  ));
  const stockDeltaByUnit = new Map<string, number[]>();
  for (const { unit, previous, current } of comparisons) {
    if (previous.timeWeightedAverageOnHand === null || current.timeWeightedAverageOnHand === null) continue;
    const values = stockDeltaByUnit.get(unit) ?? [];
    values.push(current.timeWeightedAverageOnHand - previous.timeWeightedAverageOnHand);
    stockDeltaByUnit.set(unit, values);
  }
  const stockDeltas = [...stockDeltaByUnit.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([unit, values]) => ({ unit, quantity: roundTwo(values.reduce((sum, value) => sum + value, 0) / values.length) }));

  return {
    period: { fromDate: fromDate ?? null, toDate: toDate ?? null, basis: fromDate || toDate ? 'policy_event_utc' : 'all_tracked_history' },
    productsWithHistory: trackedRows.length,
    trackedProductDays: roundTwo(trackedProductDays),
    productsWithReorderPointChanges: report.rows.filter((row) => row.reorderPointChanges > 0).length,
    reorderPointChanges: report.totals.reorderPointChanges,
    timeAtOrBelowReorderPointPercent: trackedProductDays > 0 ? roundTwo(daysAtOrBelow / trackedProductDays * 100) : null,
    outOfStockProductDays: roundTwo(outOfStockProductDays),
    productsCompared: new Set(comparisons.map((entry) => entry.productId)).size,
    comparisonPairs: comparisons.length,
    averageTimeAtOrBelowDeltaPoints: percentDeltas.length ? roundTwo(percentDeltas.reduce((sum, value) => sum + value, 0) / percentDeltas.length) : null,
    averageOutOfStockDaysPer30Delta: outOfStockDeltas.length ? roundTwo(outOfStockDeltas.reduce((sum, value) => sum + value, 0) / outOfStockDeltas.length) : null,
    averageOnHandDeltaByUnit: stockDeltas.slice(0, MAX_UNIT_GROUPS),
    omittedUnitGroups: Math.max(0, stockDeltas.length - MAX_UNIT_GROUPS),
  };
}

export async function buildSafeInsightPayload(options: InsightRequestOptions = {}, now = new Date()): Promise<SafeInsightPayload> {
  const startAt = dateBoundary(options.fromDate);
  const endAt = dateBoundary(options.toDate, true);
  const movementFromDate = options.movementFromDate ?? options.fromDate;
  const movementToDate = options.movementToDate ?? options.toDate;
  const year = now.getUTCFullYear();
  const annualStart = new Date(Date.UTC(year, 0, 1));
  const annualEnd = now;
  const [salesAnalytics, purchases, selectedMovement, monthly, inventory, classification, forecast, annual, policyReport] = await Promise.all([
    getAnalyticsOrderSummary(options.fromDate, options.toDate),
    getInsightPurchaseSummary(startAt, endAt),
    getInsightMovementSummary(startAt, endAt),
    getMonthlyStockMovementByUnit(INSIGHT_HISTORY_MONTHS, now),
    getInsightInventorySummary(),
    getItemMovementPage(movementFromDate, movementToDate, options.threshold ?? 10, 1, null),
    buildSafeDemandForecast(now),
    getInsightAnnualMaterialSummary(annualStart, annualEnd),
    buildPolicyPerformanceReport(now, options.fromDate, options.toDate),
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
      classification: { fromDate: movementFromDate ?? null, toDate: movementToDate ?? null, threshold: options.threshold ?? 10, productCount: classification.summary.productCount,
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
    policyPerformance: buildSafePolicyPerformance(policyReport, options.fromDate, options.toDate),
  };
}

export async function getAnalyticsInsight(options: InsightRequestOptions = {}, now = new Date()): Promise<AiInsight> {
  const config = getHermesConfig();
  if (!config.apiKey || !config.baseUrl) {
    throw new Error('Hermes AI is not configured. Check the backend AI settings.');
  }
  const payload = await buildSafeInsightPayload(options, now);
  const ai = await callHermesInsight(payload, { apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model });
  return { ...ai, source: 'hermes' };
}
