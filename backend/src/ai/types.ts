/**
 * AI insight types — stable response shape for interpretation layer.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

export type InsightConfidence = 'low' | 'medium' | 'high';
export type InsightSource = 'hermes' | 'fallback';

export const INSIGHT_SECTION_KEYS = [
  'monthlySalesTransactions', 'annualPurchasedMaterials', 'inventoryMovement', 'demandForecast',
  'orderRecordsPerMonth', 'monthlyGrossOrderValue', 'topOrderedProducts', 'stockStatus',
  'stockAtListedPricesByCategory', 'mostOrderedProducts', 'fewestOrderedProducts',
  'salesEstimateNextMonth', 'stockAlerts',
] as const;
export type InsightSectionKey = (typeof INSIGHT_SECTION_KEYS)[number];
export type InsightInterpretations = Record<InsightSectionKey, string>;

export interface AiInsightContent {
  summary: string;
  interpretations: InsightInterpretations;
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
  selectedOmittedUnitGroups: number;
  monthlyWindow: { startMonth: string; endMonth: string; months: Array<{ month: string; byUnit: Array<{ unit: string; inbound: number; outbound: number }> }> };
  monthlyOmittedUnitGroups: number;
  classification: { month: string; threshold: number; productCount: number; fastMovingCount: number; slowMovingCount: number };
}

export interface SafeInventorySummary {
  productCount: number; activeProductCount: number; activeLowStockCount: number; lowStockCount: number; outOfStockCount: number;
  healthyStockCount: number; criticalStockCount: number; lowStockStatusCount: number; totalInventoryValue: number;
  glassInventoryValue: number; aluminumInventoryValue: number; activeOutOfStockCount: number; activeCriticalStockCount: number; activeLowAlertCount: number;
}

export interface SafeMonthlySales {
  period: { fromDate: string | null; toDate: string | null };
  rangeTotals: { orderRecords: number; grossOrderValue: number; averageGrossOrderValue: number };
  monthlyWindow: { startMonth: string | null; endMonth: string | null; includedMonths: number; omittedMonths: number };
  byMonth: Array<{ month: string; orderRecords: number; grossOrderValue: number }>;
}

export interface SafeAnnualMaterials {
  year: number; periodBasis: 'occurredAt_utc_calendar_year_to_date';
  byCategory: Array<{ category: string; recordedCost: number; pricedReceipts: number; unpricedReceipts: number }>;
  quantityByCategoryAndUnit: Array<{ category: string; unit: string; quantity: number }>;
  omittedUnitGroups: number;
}

export interface SafeRankedItem { label: string; category: string; unit: string; orderedQuantity: number; currentStock: number; stockStatus: string }
export interface SafeRankedUnitGroup { unit: string; items: SafeRankedItem[] }
export interface SafeOrderRankings {
  selectedRangeTopByUnit: SafeRankedUnitGroup[]; allTimeMostByUnit: SafeRankedUnitGroup[];
  allTimeFewestByUnit: SafeRankedUnitGroup[];
  omittedUnitGroups: { selectedRangeTop: number; allTimeMost: number; allTimeFewest: number };
}

export interface SafeDemandForecast {
  targetPeriod: 'next month';
  productsWithEstimate: number;
  totalProducts: number;
  productsWithoutEstimate: number;
  estimatesByUnit: Array<{ unit: string; quantity: number }>;
  belowReorderPoint: number;
  recommendedOrderByUnit: Array<{ unit: string; quantity: number }>;
  omittedUnitGroups: number;
}

export interface SafeInsightPayload {
  sales: SafeSalesSummary;
  purchases: SafePurchaseSummary;
  movement: SafeMovementSummary;
  inventory: SafeInventorySummary;
  forecast: SafeDemandForecast;
  monthlySales: SafeMonthlySales;
  annualMaterials: SafeAnnualMaterials;
  orderRankings: SafeOrderRankings;
}
