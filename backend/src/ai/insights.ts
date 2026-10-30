/**
 * AI insights — aggregate analytics interpretation with local fallback.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { getAnnualPurchases, getDemandForecast, getMovementClassification, getSalesTrends } from '../analytics/service.js';
import { getHermesConfig } from './config.js';
import { callHermesInsight } from './hermes.js';
import type { AiInsight, AiInsightContent, InsightRequestOptions, SafeInsightPayload } from './types.js';

function stableGeneratedAt(year: number): string {
  return `${year}-01-01T00:00:00.000Z`;
}

function buildSafeDemandForecast() {
  const report = getDemandForecast();
  const groups = new Map<string, {
    category: string;
    unit: string;
    history: Map<string, number>;
    coveredProducts: number;
    totalProducts: number;
    forecastTotal: number;
  }>();

  for (const product of report.products) {
    const key = JSON.stringify([product.category, product.unit]);
    let group = groups.get(key);
    if (!group) {
      group = {
        category: product.category,
        unit: product.unit,
        history: new Map(),
        coveredProducts: 0,
        totalProducts: 0,
        forecastTotal: 0,
      };
      groups.set(key, group);
    }
    group.totalProducts += 1;
    if (product.forecastQuantity !== null) {
      group.coveredProducts += 1;
      group.forecastTotal += product.forecastQuantity;
    }
    for (const row of product.history) {
      group.history.set(row.month, (group.history.get(row.month) ?? 0) + row.quantity);
    }
  }

  const safeGroups = [...groups.values()].map((group) => ({
    category: group.category,
    unit: group.unit,
    history: [...group.history.entries()].sort(([left], [right]) => left.localeCompare(right))
      .map(([month, quantity]) => ({ month, quantity })),
    forecastQuantity: group.coveredProducts === group.totalProducts ? group.forecastTotal : null,
    coveredProducts: group.coveredProducts,
    totalProducts: group.totalProducts,
  })).sort((left, right) => left.category.localeCompare(right.category) || left.unit.localeCompare(right.unit));

  return {
    method: report.method,
    alpha: report.alpha,
    horizonMonths: report.horizonMonths,
    historyMonths: report.historyMonths,
    coverage: {
      coveredProducts: report.summary.availableForecasts,
      totalProducts: report.summary.productCount,
      coveredGroups: safeGroups.filter((group) => group.forecastQuantity !== null).length,
      totalGroups: safeGroups.length,
    },
    groups: safeGroups,
  };
}

export async function buildSafeInsightPayload(options: InsightRequestOptions = {}): Promise<SafeInsightPayload> {
  const year = options.year ?? new Date().getUTCFullYear();
  const threshold = options.threshold ?? 10;
  return {
    generatedAt: stableGeneratedAt(year),
    year,
    threshold,
    salesTrends: await getSalesTrends(),
    annualPurchases: getAnnualPurchases(year),
    movement: getMovementClassification(threshold),
    forecast: buildSafeDemandForecast(),
  };
}

export function generateFallbackInsight(payload: SafeInsightPayload): AiInsightContent {
  const salesTrends = payload.salesTrends as Array<{ month: string; grossSales: number; transactionCount: number }>;
  const movement = payload.movement as Array<{ month: string; quantity: number; classification: string }>;
  const purchases = payload.annualPurchases as Array<{ materialType: string; supplier: string; totalQuantity: number }>;
  const totalSales = salesTrends.reduce((sum, item) => sum + item.grossSales, 0);
  const totalTransactions = salesTrends.reduce((sum, item) => sum + item.transactionCount, 0);
  const fastMonths = movement.filter((item) => item.classification === 'fast_moving');
  const topPurchase = [...purchases].sort((a, b) => b.totalQuantity - a.totalQuantity)[0];

  return {
    summary: `SmartStock analytics for ${payload.year} show ${totalTransactions} completed sales transactions with gross sales of ${totalSales}. ${fastMonths.length} month(s) met the fast-moving threshold of ${payload.threshold}.`,
    recommendations: [
      fastMonths.length > 0 ? 'Prioritize replenishment planning for fast-moving inventory months.' : 'Continue monitoring movement because no month exceeded the fast-moving threshold.',
      topPurchase ? `Review purchasing plans for ${topPurchase.materialType} from ${topPurchase.supplier}.` : 'Add purchase history before making supplier recommendations.',
      `Forecast: ${payload.forecast.method} (alpha ${payload.forecast.alpha}, ${payload.forecast.horizonMonths}-month horizon) covers ${payload.forecast.coverage.coveredProducts} of ${payload.forecast.coverage.totalProducts} products and ${payload.forecast.coverage.coveredGroups} of ${payload.forecast.coverage.totalGroups} category/unit groups.`,
      'Interpret the statistical forecast as a planning signal; do not describe it as an AI-generated prediction.',
    ],
    risks: [
      'Low stock on fast-moving materials can delay fulfillment.',
      'Sparse historical data can reduce forecast reliability.',
    ],
    confidence: salesTrends.length > 0 && movement.length > 0 ? 'medium' : 'low',
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
