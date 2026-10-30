/**
 * AI insights — aggregate analytics interpretation with local fallback.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { getAnnualPurchasesPage, getDemandForecastPage, getOutboundMovementByUnit, getSalesTrends } from '../analytics/service.js';
import type { MonthlySalesTrendRow } from '../analytics/analytics.js';
import { getHermesConfig } from './config.js';
import { callHermesInsight } from './hermes.js';
import type { AiInsight, AiInsightContent, InsightRequestOptions, SafeInsightPayload } from './types.js';

const INSIGHT_HISTORY_MONTHS = 12;
const FORECAST_PAGE_SIZE = 100;

function roundTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function completedPeriod(now: Date) {
  const endAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startAt = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth() - INSIGHT_HISTORY_MONTHS, 1));
  const endMonth = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth() - 1, 1));
  const movementStartAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (INSIGHT_HISTORY_MONTHS - 1), 1));
  return {
    startAt,
    endAt,
    startMonth: startAt.toISOString().slice(0, 7),
    endMonth: endMonth.toISOString().slice(0, 7),
    movementStartAt,
    movementEndAt: now,
  };
}

function sumSales(rows: MonthlySalesTrendRow[]): { orders: number; grossSales: number; monthsWithSales: number } {
  return {
    orders: rows.reduce((sum, row) => sum + row.transactionCount, 0),
    grossSales: roundTwo(rows.reduce((sum, row) => sum + row.grossSales, 0)),
    monthsWithSales: rows.filter((row) => row.transactionCount > 0).length,
  };
}

function summarizeSales(rows: MonthlySalesTrendRow[]): SafeInsightPayload['sales'] {
  const previous = rows.slice(0, 6);
  const recent = rows.slice(6, 12);
  const previousTotals = sumSales(previous);
  const recentTotals = sumSales(recent);
  const total = sumSales(rows);
  const direction = rows.length < INSIGHT_HISTORY_MONTHS
    ? 'insufficient_data'
    : previousTotals.grossSales === 0 && recentTotals.grossSales === 0
      ? 'no_sales'
      : previousTotals.grossSales === 0
        ? 'new_activity'
        : recentTotals.grossSales > previousTotals.grossSales
          ? 'rising'
          : recentTotals.grossSales < previousTotals.grossSales
            ? 'falling'
            : 'steady';

  return {
    period: { startMonth: rows[0]?.month ?? null, endMonth: rows.at(-1)?.month ?? null, months: rows.length },
    orderCount: total.orders,
    grossSales: total.grossSales,
    monthsWithSales: total.monthsWithSales,
    comparison: {
      previousMonths: previous.length,
      recentMonths: recent.length,
      previousGrossSales: previousTotals.grossSales,
      recentGrossSales: recentTotals.grossSales,
      changePercent: previousTotals.grossSales > 0
        ? roundTwo((recentTotals.grossSales - previousTotals.grossSales) / previousTotals.grossSales * 100)
        : null,
      direction,
    },
  };
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

export async function buildSafeInsightPayload(options: InsightRequestOptions = {}): Promise<SafeInsightPayload> {
  const now = new Date();
  const year = options.year ?? now.getUTCFullYear();
  const period = completedPeriod(now);
  const salesAsOf = new Date(period.endAt.getTime() - 1);
  const [salesRows, purchases, outboundByUnit, forecast] = await Promise.all([
    getSalesTrends('1Y', salesAsOf),
    getAnnualPurchasesPage(year, 1, null),
    getOutboundMovementByUnit(period.movementStartAt, period.movementEndAt),
    buildSafeDemandForecast(now),
  ]);

  return {
    year,
    sales: summarizeSales(salesRows),
    purchases: {
      year,
      recordedCost: roundTwo(purchases.totalSpend),
      pricedReceipts: purchases.pricedReceiptCount,
      unpricedReceipts: purchases.unpricedReceiptCount,
    },
    movement: {
      period: {
        startDate: period.movementStartAt.toISOString().slice(0, 10),
        endDate: period.movementEndAt.toISOString().slice(0, 10),
        months: INSIGHT_HISTORY_MONTHS,
      },
      outboundByUnit,
    },
    forecast,
  };
}

function formatUnitTotals(rows: Array<{ unit: string; quantity: number }>): string {
  return rows.length
    ? rows.map((row) => {
      const unit = row.unit === 'sheet' && row.quantity !== 1 ? 'sheets' : row.unit;
      return `${roundTwo(row.quantity)} ${unit}`;
    }).join(' and ')
    : 'no unit-specific estimate is available';
}

export function generateFallbackInsight(payload: SafeInsightPayload): AiInsightContent {
  const { sales, purchases, movement, forecast } = payload;
  const { direction, recentGrossSales, changePercent } = sales.comparison;
  const trendSummary = direction === 'rising'
    ? `Gross sales were ${Math.abs(changePercent ?? 0)}% higher in the latest six complete months than in the six before them.`
    : direction === 'falling'
      ? `Gross sales were ${Math.abs(changePercent ?? 0)}% lower in the latest six complete months than in the six before them.`
      : direction === 'steady'
        ? 'Gross sales were the same in the latest six complete months as in the six before them.'
        : direction === 'new_activity'
          ? `No sales were recorded in the earlier six-month period; the latest six months recorded ${recentGrossSales} in gross sales.`
          : direction === 'no_sales'
            ? 'No non-cancelled sales were recorded in the last 12 complete months.'
            : 'There are not enough complete months in this report to compare two six-month periods.';
  const forecastSummary = forecast.productsWithEstimate > 0
    ? ` Rough next-month estimates are ${formatUnitTotals(forecast.estimatesByUnit)} for ${forecast.productsWithEstimate} of ${forecast.totalProducts} products.`
    : ` No next-month estimates are available yet for the ${forecast.totalProducts} products in the report.`;
  const summary = `${trendSummary}${forecastSummary}`;

  const coverageRisk = forecast.productsWithoutEstimate > 0
    ? `Estimates are available for ${forecast.productsWithEstimate} of ${forecast.totalProducts} products; the rest need more recent sales history.`
    : 'Past sales estimates are a planning guide, not a promise of future demand.';
  const costRisk = purchases.unpricedReceipts > 0
    ? `Recorded purchase costs exclude ${purchases.unpricedReceipts} ${purchases.unpricedReceipts === 1 ? 'receipt' : 'receipts'} with no cost entered.`
    : 'Keep recording purchase costs so spending totals stay complete.';
  const movementRisk = movement.outboundByUnit.length > 0
    ? `Recorded outbound movement was ${formatUnitTotals(movement.outboundByUnit)}; these totals do not show how quickly any one product sells.`
    : 'No outbound stock movements were recorded in this period.';

  return {
    summary,
    recommendations: [
      'Check each product’s current stock before using an estimate to place an order.',
      purchases.unpricedReceipts > 0
        ? 'Record the missing purchase costs so the spending summary is more complete.'
        : 'Keep recording purchase costs for every receipt.',
      'Keep amounts with different units separate, and review individual items for selling speed.',
    ],
    risks: [coverageRisk, `${costRisk} ${movementRisk}`],
    confidence: sales.monthsWithSales < 3 || forecast.productsWithEstimate === 0
      ? 'low'
      : forecast.productsWithoutEstimate > 0 || purchases.unpricedReceipts > 0
        ? 'medium'
        : 'high',
  };
}

export async function getAnalyticsInsight(options: InsightRequestOptions = {}): Promise<AiInsight> {
  const payload = await buildSafeInsightPayload(options);
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
