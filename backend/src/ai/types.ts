/**
 * AI insight types — stable response shape for interpretation layer.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

export type InsightConfidence = 'low' | 'medium' | 'high';
export type InsightSource = 'hermes' | 'fallback';

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
}

export type SalesDirection = 'rising' | 'falling' | 'steady' | 'new_activity' | 'no_sales' | 'insufficient_data';

export interface SafeSalesSummary {
  period: { startMonth: string | null; endMonth: string | null; months: number };
  orderCount: number;
  grossSales: number;
  monthsWithSales: number;
  comparison: {
    previousMonths: number;
    recentMonths: number;
    previousGrossSales: number;
    recentGrossSales: number;
    changePercent: number | null;
    direction: SalesDirection;
  };
}

export interface SafePurchaseSummary {
  year: number;
  recordedCost: number;
  pricedReceipts: number;
  unpricedReceipts: number;
}

export interface SafeMovementSummary {
  period: { startDate: string; endDate: string; months: number };
  outboundByUnit: Array<{ unit: string; quantity: number; movementCount: number }>;
}

export interface SafeDemandForecast {
  targetPeriod: 'next month';
  productsWithEstimate: number;
  totalProducts: number;
  productsWithoutEstimate: number;
  estimatesByUnit: Array<{ unit: string; quantity: number }>;
}

export interface SafeInsightPayload {
  year: number;
  sales: SafeSalesSummary;
  purchases: SafePurchaseSummary;
  movement: SafeMovementSummary;
  forecast: SafeDemandForecast;
}
