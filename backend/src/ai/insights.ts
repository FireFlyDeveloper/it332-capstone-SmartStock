/**
 * AI insights — aggregate analytics interpretation with local fallback.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { getAnalyticsOrderSummary, getInsightInventorySummary, getInsightMovementSummary, getInsightPurchaseSummary, getMonthlyItemMovementPage, getMonthlyStockMovementByUnit, getDemandForecastPage } from '../analytics/service.js';
import type { SalesDirection } from './types.js';
import { getHermesConfig } from './config.js';
import { callHermesInsight } from './hermes.js';
import type { AiInsight, AiInsightContent, InsightRequestOptions, SafeInsightPayload } from './types.js';

const INSIGHT_HISTORY_MONTHS = 12;
const FORECAST_PAGE_SIZE = 100;

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
  let summary: { productCount: number; availableForecasts: number; insufficientHistory: number } | null = null;
  let cursor: { name: string; productId: string } | null = null;
  let pages = 0;

  while (true) {
    pages += 1;
    if (pages > 1000) throw new Error('Demand-forecast pagination exceeded its safety limit');
    const report = await getDemandForecastPage(INSIGHT_HISTORY_MONTHS, FORECAST_PAGE_SIZE, cursor, now);
    summary ??= report.summary;
    for (const product of report.products) {
      if (product.forecastQuantity === null) continue;
      const unit = product.unit.trim() || 'unknown';
      estimatesByUnit.set(unit, (estimatesByUnit.get(unit) ?? 0) + product.forecastQuantity);
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
      .sort((left, right) => left.unit.localeCompare(right.unit)),
  };
}

export async function buildSafeInsightPayload(options: InsightRequestOptions = {}, now = new Date()): Promise<SafeInsightPayload> {
  const movementMonth = options.movementMonth ?? now.toISOString().slice(0, 7);
  const startAt = dateBoundary(options.fromDate);
  const endAt = dateBoundary(options.toDate, true);
  const [salesAnalytics, purchases, selectedMovement, monthly, inventory, classification, forecast] = await Promise.all([
    getAnalyticsOrderSummary(options.fromDate, options.toDate),
    getInsightPurchaseSummary(startAt, endAt),
    getInsightMovementSummary(startAt, endAt),
    getMonthlyStockMovementByUnit(INSIGHT_HISTORY_MONTHS, now),
    getInsightInventorySummary(),
    getMonthlyItemMovementPage(movementMonth, options.threshold ?? 10, 1, null),
    buildSafeDemandForecast(now),
  ]);
  const trendRows = salesAnalytics.salesTrendData;
  return {
    sales: { period: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null }, orderCount: salesAnalytics.totalOrderCount,
      averageOrderValue: roundTwo(salesAnalytics.averageOrderValue), grossSales: roundTwo(trendRows.reduce((sum, row) => sum + row.sales, 0)),
      bucketsWithSales: trendRows.filter((row) => row.sales > 0).length, trend: summarizeTrend(trendRows) },
    purchases: { period: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null },
      recordedCost: roundTwo(purchases.recordedCost), pricedReceipts: purchases.pricedReceipts, unpricedReceipts: purchases.unpricedReceipts },
    movement: {
      selectedPeriod: { fromDate: options.fromDate ?? null, toDate: options.toDate ?? null, basis: startAt || endAt ? 'occurredAt_utc' : 'all_time' },
      selectedTotalsByUnit: selectedMovement.map((row) => ({ unit: row.unit, inbound: roundTwo(row.inboundQuantity), outbound: roundTwo(row.outboundQuantity), inboundCount: row.inboundCount, outboundCount: row.outboundCount })),
      monthlyWindow: { startMonth: monthly.period.startMonth, endMonth: monthly.period.endMonth,
        months: monthly.months.map((month) => ({ month, byUnit: monthly.rows.filter((row) => row.month === month).map((row) => ({
          unit: row.unit, inbound: roundTwo(row.inboundQuantity), outbound: roundTwo(row.outboundQuantity),
        })) })) },
      classification: { month: movementMonth, threshold: options.threshold ?? 10, productCount: classification.summary.productCount,
        fastMovingCount: classification.summary.fastMovingCount, slowMovingCount: classification.summary.slowMovingCount },
    },
    inventory, forecast,
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
  return {
    summary,
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
