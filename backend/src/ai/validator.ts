/**
 * AI response validator — accepts only complete insight JSON.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { INSIGHT_SECTION_KEYS, type AiInsightContent, type InsightConfidence, type InsightSectionKey } from './types.js';

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
  if (!candidate.interpretations || typeof candidate.interpretations !== 'object' || Array.isArray(candidate.interpretations)) return null;
  const rawInterpretations = candidate.interpretations as Record<string, unknown>;
  if (Object.keys(rawInterpretations).length !== INSIGHT_SECTION_KEYS.length
    || INSIGHT_SECTION_KEYS.some((key) => !Object.hasOwn(rawInterpretations, key))) return null;
  const interpretations = {} as Record<InsightSectionKey, string>;
  for (const key of INSIGHT_SECTION_KEYS) {
    const text = rawInterpretations[key];
    if (!isNonEmptyString(text) || text.trim().length > 500) return null;
    interpretations[key] = text.trim();
  }
  if (!isNonEmptyString(candidate.summary)) return null;
  if (!isNonEmptyStringArray(candidate.recommendations)) return null;
  if (!isNonEmptyStringArray(candidate.risks)) return null;
  if (!CONFIDENCES.has(candidate.confidence as InsightConfidence)) return null;

  return {
    summary: candidate.summary.trim(),
    interpretations,
    recommendations: candidate.recommendations.map((item) => item.trim()),
    risks: candidate.risks.map((item) => item.trim()),
    confidence: candidate.confidence as InsightConfidence,
  };
}
