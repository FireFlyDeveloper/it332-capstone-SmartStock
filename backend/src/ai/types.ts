/**
 * AI insight types — stable response shape for interpretation layer.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

export type InsightConfidence = 'low' | 'medium' | 'high';
export type InsightSource = 'deepseek' | 'fallback';

export interface AiInsightContent {
  summary: string;
  recommendations: string[];
  risks: string[];
  confidence: InsightConfidence;
}

export interface AiInsight extends AiInsightContent {
  source: InsightSource;
}

export interface InsightRequestOptions {
  year?: number;
  threshold?: number;
  forecastQuantities?: number[];
}

export interface SafeInsightPayload {
  generatedAt: string;
  year: number;
  threshold: number;
  salesTrends: unknown;
  annualPurchases: unknown;
  movement: unknown;
  forecast: unknown;
}
