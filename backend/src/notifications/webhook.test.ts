/**
 * Notification webhook tests — n8n-compatible event sender safety.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendNotificationEvent } from './webhook.js';
import type { NotificationEvent } from './types.js';

const sampleEvent: NotificationEvent = {
  type: 'order.status_changed',
  occurredAt: '2026-07-17T00:00:00.000Z',
  data: {
    orderId: 'order-1',
    referenceNumber: 'SS-2026-00001',
    previousStatus: 'processing',
    status: 'in_transit',
  },
};

describe('notification webhook sender', () => {
  const originalWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.N8N_WEBHOOK_URL;
  });

  afterEach(() => {
    if (originalWebhookUrl === undefined) delete process.env.N8N_WEBHOOK_URL;
    else process.env.N8N_WEBHOOK_URL = originalWebhookUrl;
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('no-ops safely when N8N_WEBHOOK_URL is missing without printing a URL', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await sendNotificationEvent(sampleEvent);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining('webhook missing'));
    expect(info.mock.calls.flat().join(' ')).not.toContain('http');
  });

  it('retries once after a transient webhook fetch failure', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.test/webhook/secret-token';
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary network error'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(sendNotificationEvent(sampleEvent)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(process.env.N8N_WEBHOOK_URL);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ type: 'order.status_changed' });
  });

  it('swallows final webhook failure and never logs the configured URL', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example.test/webhook/secret-token';
    const fetchMock = vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(sendNotificationEvent(sampleEvent)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.flat().join(' ')).not.toContain(process.env.N8N_WEBHOOK_URL);
  });
});
