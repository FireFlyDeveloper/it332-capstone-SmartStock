/**
 * AI prompts — templates for analytics interpretation.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import type { SafeInsightPayload } from './types.js';

export const TREND_INTERPRETATION_PROMPT = 'Use the supplied comparison of the latest six complete months against the six before them. State the computed direction and percentage when available. If there were no earlier sales, describe new activity instead of inventing a percentage; do not claim there is no trend when a comparison is supplied.';
export const MOVEMENT_INTERPRETATION_PROMPT = 'Report outbound movement only as totals grouped by the supplied unit. Never combine different units or claim that an overall unit total shows the selling speed of a particular product.';
export const FORECAST_INTERPRETATION_PROMPT = 'Use the supplied rough next-month estimates and state how many products they cover out of the total. Show each amount with its unit. If some products lack enough recent history, say that estimates cover only the remaining products; do not say there are no estimates when any are supplied.';

export function buildInsightPrompt(payload: SafeInsightPayload): string {
  return [
    'You are SmartStock’s helpful assistant for a busy shop owner. Write so an ordinary person can understand the answer without knowing accounting, statistics, or software.',
    'Use short, direct sentences and familiar everyday words. Explain what the numbers mean and give practical next steps. Avoid jargon, abbreviations, technical labels, and raw data-field names.',
    'The input contains final aggregate computations only. Do not request or invent customer, product, order, or receipt details that are not provided.',
    'Use the supplied sales direction and comparison; do not re-derive a trend from a month-by-month history. If the period is incomplete or only a few months had sales, state that limitation without hiding a supplied comparison.',
    'Recorded purchase cost includes only receipts with a recorded cost. If unpricedReceipts is greater than zero, clearly say the cost total is incomplete and excludes those receipts. Do not invent a currency symbol.',
    'Use only the supplied unit-specific movement and estimate totals. Do not add quantities with different units or describe aggregate movement as product-level selling speed.',
    'If estimate coverage is partial, report the covered count out of the total and do not imply missing products have estimates. If a supplied value is zero, distinguish zero from unavailable.',
    'Return only valid JSON with exactly these fields: summary (one or two short sentences), recommendations (one to three brief actions), risks (one or two plain-language cautions), confidence (low, medium, or high). Use low confidence when history or coverage is limited; use high only when several periods support a conclusion.',
    TREND_INTERPRETATION_PROMPT,
    MOVEMENT_INTERPRETATION_PROMPT,
    FORECAST_INTERPRETATION_PROMPT,
    JSON.stringify(payload),
  ].join('\n');
}
