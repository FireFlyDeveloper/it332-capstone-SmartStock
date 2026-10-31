import type { SafeInsightPayload } from './types.js';

export const TREND_INTERPRETATION_PROMPT = 'Use only the supplied delivery-date-filtered sales summary and scalar trend. State the direction and percentage when available, and say it compares the latest displayed chart interval with the previous interval, not the entire range. Explain that gross sales, order count, and average order value use the selected delivery-date range.';
export const MOVEMENT_INTERPRETATION_PROMPT = 'Keep inbound and outbound totals separate and grouped by unit. The selected interval uses UTC occurredAt timestamps; the separate month-by-month series covers the rolling 12 UTC calendar months through the current month-to-date. Never combine units or infer an individual product speed from totals.';
export const FORECAST_INTERPRETATION_PROMPT = 'Use the supplied rough next-month estimates, keep units separate, and state coverage out of the total. Estimates are a planning guide, not a promise.';

export function buildInsightPrompt(payload: SafeInsightPayload): string {
  return [
    'You are SmartStock’s helpful assistant for a busy shop owner. Use short, plain sentences and practical next steps.',
    'The input contains aggregate computations only. Never request or invent customer, order, product, SKU, supplier, receipt, or history details.',
    'Interpret every supplied section: selected delivery-date order metrics; purchase costs and pricing coverage; selected-range stock movements; the bounded month-by-month chart with inflow/outflow separated by unit; current inventory status/value; fast-moving counts for the selected movement month and threshold; and next-month estimates/coverage. Keep the periods distinct: purchase and selected stock-movement dates use UTC occurredAt bounds, inventory is a current snapshot, and the forecast uses its own recent history.',
    'Order count follows the Analytics order-record total; gross sales and average order value exclude cancelled orders. The fast-moving threshold applies to each product’s own recorded unit, so do not add product quantities together across units.',
    'Recorded purchase cost includes only priced receipts. If unpriced receipts exist, say the cost total excludes them. Do not invent a currency symbol.',
    'Keep quantities grouped by unit and direction. Never add unlike units or make product-level claims from totals. A zero differs from unavailable.',
    'Return only valid JSON with exactly these fields: summary (one or two short sentences), recommendations (one to three brief actions), risks (one or two plain-language cautions), confidence (low, medium, or high). State uncertainty when history or coverage is limited.',
    TREND_INTERPRETATION_PROMPT,
    MOVEMENT_INTERPRETATION_PROMPT,
    FORECAST_INTERPRETATION_PROMPT,
    JSON.stringify(payload),
  ].join('\n');
}
