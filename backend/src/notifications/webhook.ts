/**
 * Notification webhook sender — safe n8n-compatible delivery.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import type { NotificationEvent } from './types.js';

type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number }>;

function getFetch(): FetchLike | null {
  return typeof globalThis.fetch === 'function' ? (globalThis.fetch as FetchLike) : null;
}

async function postWebhook(url: string, event: NotificationEvent): Promise<void> {
  const fetcher = getFetch();
  if (!fetcher) throw new Error('fetch unavailable');
  const response = await fetcher(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error(`webhook responded with status ${response.status}`);
}

export async function sendNotificationEvent(event: NotificationEvent): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info('[notifications] webhook missing; event not sent');
    return;
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await postWebhook(webhookUrl, event);
      return;
    } catch (error) {
      if (attempt === 2) {
        const message = error instanceof Error ? error.message : 'unknown webhook error';
        console.warn(`[notifications] webhook delivery failed after retry: ${message}`);
      }
    }
  }
}
