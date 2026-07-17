/**
 * AI insights — aggregate analytics interpretation with local fallback.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { getAnnualPurchases, getForecast, getMovementClassification, getSalesTrends } from '../analytics/service.js';
import { getDeepSeekConfig } from './config.js';
import { callDeepSeekInsight } from './deepseek.js';
import type { AiInsight, AiInsightContent, InsightRequestOptions, SafeInsightPayload } from './types.js';

function stableGeneratedAt(year: number): string {
  return `${year}-01-01T00:00:00.000Z`;
}

export function buildSafeInsightPayload(options: InsightRequestOptions = {}): SafeInsightPayload {
  const year = options.year ?? new Date().getUTCFullYear();
  const threshold = options.threshold ?? 10;
  const quantities = options.forecastQuantities ?? getMovementClassification(threshold).map((item) => item.quantity);
  return {
    generatedAt: stableGeneratedAt(year),
    year,
    threshold,
    salesTrends: getSalesTrends(),
    annualPurchases: getAnnualPurchases(year),
    movement: getMovementClassification(threshold),
    forecast: quantities.length > 0 ? getForecast(quantities) : { alpha: 0.3, forecast: 0 },
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
      'Use the forecast as a planning signal, not as a custom-trained machine learning prediction.',
    ],
    risks: [
      'Low stock on fast-moving materials can delay fulfillment.',
      'Sparse historical data can reduce forecast reliability.',
    ],
    confidence: salesTrends.length > 0 && movement.length > 0 ? 'medium' : 'low',
  };
}

export async function getAnalyticsInsight(options: InsightRequestOptions = {}): Promise<AiInsight> {
  const payload = buildSafeInsightPayload(options);
  const fallback = (): AiInsight => ({ ...generateFallbackInsight(payload), source: 'fallback' });
  const config = getDeepSeekConfig();
  if (!config.apiKey) return fallback();

  try {
    const ai = await callDeepSeekInsight(payload, { apiKey: config.apiKey, endpoint: config.endpoint, model: config.model });
    return { ...ai, source: 'deepseek' };
  } catch {
    return fallback();
  }
}
