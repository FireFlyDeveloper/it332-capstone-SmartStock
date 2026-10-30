/**
 * Hermes Agent client for the SmartStock aggregate analytics interpreter.
 */

import { createHash } from 'node:crypto';
import type { HermesConfig } from './config.js';
import { buildInsightPrompt } from './prompts.js';
import { validateAiInsightResponse } from './validator.js';
import type { AiInsightContent, SafeInsightPayload } from './types.js';

type FetchLike = typeof fetch;

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = parts;
  return first === 10
    || first === 127
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
}

function assertSafeBaseUrl(baseUrl: string): URL {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('Hermes API base URL must be a valid URL');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Hermes API base URL must not include credentials, query parameters, or fragments');
  }
  if (url.protocol === 'https:') return url;
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (url.protocol === 'http:' && (hostname === 'localhost' || hostname === '::1' || isPrivateIpv4(hostname))) return url;
  throw new Error('Hermes API must use HTTPS or a loopback/private HTTP address');
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

export async function callHermesInsight(
  payload: SafeInsightPayload | Record<string, unknown>,
  config: Required<HermesConfig>,
  fetchImpl: FetchLike = fetch,
): Promise<AiInsightContent> {
  const baseUrl = assertSafeBaseUrl(config.baseUrl);
  const endpoint = new URL('chat/completions', `${baseUrl.toString().replace(/\/+$/, '')}/`).toString();
  const idempotencyKey = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const body = {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: 'Interpret only the aggregate SmartStock analytics supplied by the user. Do not call tools or request identifying records. Return only valid JSON with summary, recommendations, risks, and confidence.',
      },
      { role: 'user', content: buildInsightPrompt(payload as SafeInsightPayload) },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
    tools: [],
    tool_choice: 'none',
  };

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
      'idempotency-key': `smartstock-${idempotencyKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Hermes API request failed with status ${response.status}`);
  const validated = validateAiInsightResponse(parseMessageContent(await response.json()));
  if (!validated) throw new Error('Hermes API response failed validation');
  return validated;
}
