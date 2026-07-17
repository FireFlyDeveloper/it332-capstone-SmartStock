/**
 * AI prompts — templates for analytics interpretation.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import type { SafeInsightPayload } from './types.js';

export const TREND_INTERPRETATION_PROMPT = 'Interpret monthly sales trends using only aggregate SmartStock analytics.';
export const MOVEMENT_INTERPRETATION_PROMPT = 'Interpret fast- and slow-moving inventory using only aggregate movement totals.';
export const FORECAST_INTERPRETATION_PROMPT = 'Interpret forecast output and recommend inventory planning actions.';

export function buildInsightPrompt(payload: SafeInsightPayload): string {
  return [
    'You are an inventory analytics assistant for SmartStock.',
    'Use only the aggregate JSON below. Do not infer or request customer personal data.',
    'Return strict JSON with fields: summary (string), recommendations (string[]), risks (string[]), confidence (low|medium|high).',
    TREND_INTERPRETATION_PROMPT,
    MOVEMENT_INTERPRETATION_PROMPT,
    FORECAST_INTERPRETATION_PROMPT,
    JSON.stringify(payload),
  ].join('\n');
}
