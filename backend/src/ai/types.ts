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
  fromDate?: string;
  toDate?: string;
  movementMonth?: string;
  threshold?: number;
}

export type SalesDirection = 'rising' | 'falling' | 'steady' | 'new_activity' | 'no_sales' | 'insufficient_data';

export interface SafeSalesSummary {
  period: { fromDate: string | null; toDate: string | null };
  orderCount: number;
  averageOrderValue: number;
  grossSales: number;
  bucketsWithSales: number;
  trend: { direction: SalesDirection; changePercent: number | null; previousSales: number; recentSales: number };
}

export interface SafePurchaseSummary {
  period: { fromDate: string | null; toDate: string | null };
  recordedCost: number;
  pricedReceipts: number;
  unpricedReceipts: number;
}

export interface SafeMovementSummary {
  selectedPeriod: { fromDate: string | null; toDate: string | null; basis: 'all_time' | 'occurredAt_utc' };
  selectedTotalsByUnit: Array<{ unit: string; inbound: number; outbound: number; inboundCount: number; outboundCount: number }>;
  monthlyWindow: { startMonth: string; endMonth: string; months: Array<{ month: string; byUnit: Array<{ unit: string; inbound: number; outbound: number }> }> };
  classification: { month: string; threshold: number; productCount: number; fastMovingCount: number; slowMovingCount: number };
}

export interface SafeInventorySummary {
  productCount: number; activeProductCount: number; activeLowStockCount: number; lowStockCount: number; outOfStockCount: number;
  healthyStockCount: number; criticalStockCount: number; lowStockStatusCount: number; totalInventoryValue: number;
}

export interface SafeDemandForecast {
  targetPeriod: 'next month';
  productsWithEstimate: number;
  totalProducts: number;
  productsWithoutEstimate: number;
  estimatesByUnit: Array<{ unit: string; quantity: number }>;
}

export interface SafeInsightPayload {
  sales: SafeSalesSummary;
  purchases: SafePurchaseSummary;
  movement: SafeMovementSummary;
  inventory: SafeInventorySummary;
  forecast: SafeDemandForecast;
}
