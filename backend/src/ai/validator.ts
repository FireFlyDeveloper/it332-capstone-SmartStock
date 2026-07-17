/**
 * AI response validator — accepts only complete insight JSON.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import type { AiInsightContent, InsightConfidence } from './types.js';

const CONFIDENCES = new Set<InsightConfidence>(['low', 'medium', 'high']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

export function validateAiInsightResponse(value: unknown): AiInsightContent | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (!isNonEmptyString(candidate.summary)) return null;
  if (!isNonEmptyStringArray(candidate.recommendations)) return null;
  if (!isNonEmptyStringArray(candidate.risks)) return null;
  if (!CONFIDENCES.has(candidate.confidence as InsightConfidence)) return null;

  return {
    summary: candidate.summary.trim(),
    recommendations: candidate.recommendations.map((item) => item.trim()),
    risks: candidate.risks.map((item) => item.trim()),
    confidence: candidate.confidence as InsightConfidence,
  };
}
