/**
 * DeepSeek client — HTTPS-only AI interpretation calls.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import type { DeepSeekConfig } from './config.js';
import { buildInsightPrompt } from './prompts.js';
import { validateAiInsightResponse } from './validator.js';
import type { AiInsightContent, SafeInsightPayload } from './types.js';

type FetchLike = typeof fetch;

function assertHttps(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('DeepSeek endpoint must be a valid HTTPS URL');
  }
  if (url.protocol !== 'https:') throw new Error('DeepSeek endpoint must use HTTPS');
}

function parseMessageContent(data: unknown): unknown {
  const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function callDeepSeekInsight(
  payload: SafeInsightPayload | Record<string, unknown>,
  config: Required<DeepSeekConfig>,
  fetchImpl: FetchLike = fetch,
): Promise<AiInsightContent> {
  assertHttps(config.endpoint);
  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: 'Return only valid JSON. Never include customer PII.' },
      { role: 'user', content: buildInsightPrompt(payload as SafeInsightPayload) },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`DeepSeek request failed with status ${response.status}`);
      const data = await response.json();
      const validated = validateAiInsightResponse(parseMessageContent(data));
      if (!validated) throw new Error('DeepSeek response failed validation');
      return validated;
    } catch (error) {
      lastError = error;
      if (attempt === 1) break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('DeepSeek request failed');
}
