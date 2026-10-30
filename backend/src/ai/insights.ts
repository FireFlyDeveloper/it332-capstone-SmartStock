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
  const totalTransactions = salesTrends.reduce((sum, item) => sum + item.transactionCount, 0);
  const salesMonths = salesTrends.length;
  const { coveredProducts, totalProducts } = payload.forecast.coverage;
  const insufficientProducts = Math.max(0, totalProducts - coveredProducts);

  const orderWord = totalTransactions === 1 ? 'order' : 'orders';
  const summary = salesMonths === 0
    ? `No completed sales are recorded for ${payload.year}, so there is not enough information to spot a sales pattern.`
    : salesMonths === 1
      ? `The report includes ${totalTransactions} completed ${orderWord}, but sales are recorded in only one month. That is not enough to tell whether sales are rising or falling.`
      : `The report includes ${totalTransactions} completed ${orderWord} across ${salesMonths} months. Check later sales before assuming this pattern will continue.`;

  const insufficientHistoryRisk = insufficientProducts === 1
    ? 'One product does not have enough past sales for an estimate yet.'
    : `${insufficientProducts} products do not have enough past sales for estimates yet.`;

  return {
    summary,
    recommendations: [
      'Check each product’s current stock before placing another order.',
      'Keep recording completed sales over more months so the sales estimates have better information.',
      'Keep pieces and square meters separate when comparing amounts.',
    ],
    risks: [
      salesMonths < 3
        ? 'There are not enough months of sales records to show a reliable pattern.'
        : 'Past sales may not match what customers need next, so check current stock before ordering.',
      insufficientProducts > 0
        ? insufficientHistoryRisk
        : 'Sales estimates are based on past orders and may not match future demand.',
    ],
    confidence: salesMonths < 3 || coveredProducts === 0
      ? 'low'
      : coveredProducts < totalProducts
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
