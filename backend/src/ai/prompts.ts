import { INSIGHT_SECTION_KEYS, type SafeInsightPayload } from './types.js';

export const TREND_INTERPRETATION_PROMPT = 'Monthly sales transactions are calendar-month counts of delivery-date order records; they include cancelled records. Monthly gross order value excludes cancelled orders, includes unpaid and partially paid orders, and does not subtract refunds. Gross value is not profit. State the capped monthly window and omitted-month count when relevant.';
export const MOVEMENT_INTERPRETATION_PROMPT = 'Keep inbound and outbound totals separate and grouped by unit. The selected interval uses UTC occurredAt timestamps; the separate month-by-month series is a UTC calendar-month window, with the current month clipped to month-to-date. Never combine units or infer an individual-product speed from totals.';
export const FORECAST_INTERPRETATION_PROMPT = 'Use the supplied rough next-month estimates, keep units separate, and state coverage out of the total. Missing history means unavailable, not zero demand. Estimates are a planning guide, not a promise; explain stock-policy pressure only from supplied counts.';

const SECTION_RULES = [
  'monthlySalesTransactions: relate monthly gross value to transaction count without treating count as revenue.',
  'annualPurchasedMaterials: describe current UTC calendar-year-to-date inbound cost and quantity by category and unit; cost excludes unpriced receipts, and never name suppliers.',
  'inventoryMovement: interpret inbound and outbound separately by UTC period and unit; do not infer product-level demand from totals.',
  'demandForecast: explain estimate eligibility/coverage and supplied reorder pressure; missing history is unavailable, not zero demand.',
  'orderRecordsPerMonth: interpret monthly delivery-date record counts and state they include cancelled records.',
  'monthlyGrossOrderValue: compare gross value only; it is not profit, excludes cancelled orders, includes unpaid/partial orders, and does not subtract refunds.',
  'topOrderedProducts: selected delivery-date range, non-cancelled quantities, top five products within each of at most five alphabetically selected unit groups. Do not compare totals across units; mention omitted unit-group count when nonzero.',
  'stockStatus: interpret current healthy/low/critical/out-of-stock counts for all non-deleted products using the existing thresholds.',
  'stockAtListedPricesByCategory: current stock multiplied by listed selling price by category; explicitly say this is not purchase cost or realized sales.',
  'mostOrderedProducts: all-time, non-cancelled quantities, independent of the selected date filter, top five within each of at most five alphabetically selected unit groups; mention omitted unit-group count when nonzero.',
  'fewestOrderedProducts: all-time bottom five within each of at most five alphabetically selected unit groups, including zero-order products; distinguish zero orders from unavailable data and mention omitted unit groups when nonzero.',
  'salesEstimateNextMonth: interpret next-month estimated quantities by unit and coverage; this is a planning estimate, not promised sales.',
  'stockAlerts: report active-product-only alert counts by severity and give a practical next step without inventing product names.',
];

export function buildInsightPrompt(payload: SafeInsightPayload): string {
  return [
    'You are SmartStock’s helpful assistant for a busy shop owner. Speak plainly to a shop owner, using everyday words, short sentences, and practical next steps.',
    'The input contains bounded aggregate computations only. Do not ask for more datasets. Never request or invent customer, order, product, SKU, supplier, receipt, or history details.',
    'Interpret each requested section according to its rule below. Keep periods distinct: selected orders use inclusive deliveryDate; purchase and selected stock-movement dates use UTC occurredAt bounds; annual purchases are current UTC calendar year-to-date; inventory and alerts are current snapshots; rankings use their explicitly stated time scope; forecast history uses recent complete UTC months.',
    'Sales/order-record counts include cancelled orders. Gross order value excludes cancelled orders, includes unpaid or partially paid orders, and refunds are not deducted. Annual purchase costs include priced receipts only; call out unpriced receipts. Listed-price stock is not cost or realized sales.',
    'Keep quantities grouped by unit and movement direction. Never add unlike units or make product-level claims from aggregate movement. A zero is different from unavailable. Do not infer causes, profit, currency symbols, or facts that are absent from the payload.',
    'SECTION RULES:', ...SECTION_RULES,
    `Return only valid JSON with exactly these top-level keys: summary, interpretations, recommendations, risks, confidence. interpretations must contain exactly these 13 keys and no others: ${INSIGHT_SECTION_KEYS.join(', ')}. Every interpretation must be a plain-language non-empty string of at most 500 characters. summary is one or two short sentences; recommendations has one to three brief actions; risks has one or two plain-language cautions; confidence is low, medium, or high.`,
    TREND_INTERPRETATION_PROMPT,
    MOVEMENT_INTERPRETATION_PROMPT,
    FORECAST_INTERPRETATION_PROMPT,
    JSON.stringify(payload),
  ].join('\n');
}
