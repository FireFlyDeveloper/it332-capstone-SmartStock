import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as webpush from 'web-push';
import { saveWebPushSubscription, sendWebPushEvent, _resetWebPushSubscriptions } from './push.js';
import type { NotificationEvent } from './types.js';

vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/push-endpoint-secret',
  keys: { p256dh: 'public-key', auth: 'auth-key' },
};

const event: NotificationEvent = {
  type: 'order.status_changed',
  occurredAt: '2026-11-07T00:00:00.000Z',
  data: {
    orderId: 'order-1',
    referenceNumber: 'SS-PRIVATE-123',
    previousStatus: 'processing',
    status: 'in_transit',
  },
};

describe('Web Push delivery', () => {
  beforeEach(() => {
    _resetWebPushSubscriptions();
    vi.stubEnv('VAPID_PUBLIC_KEY', 'public-test-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-test-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:push-test@example.test');
    vi.mocked(webpush.sendNotification).mockReset().mockResolvedValue({} as never);
    vi.mocked(webpush.setVapidDetails).mockReset();
  });

  afterEach(() => {
    _resetWebPushSubscriptions();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('sends a generic privacy-safe event to enabled subscriptions', async () => {
    await saveWebPushSubscription('user-1', subscription, {
      lowStockAlerts: true,
      orderStatusUpdates: true,
      deliveryDispatches: true,
    });

    const result = await sendWebPushEvent(event);
    expect(result).toEqual({ sent: 1 });
    expect(webpush.sendNotification).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(vi.mocked(webpush.sendNotification).mock.calls[0][1])) as Record<string, unknown>;
    expect(payload).toMatchObject({ title: 'Order update', url: '/orders', tag: 'order-update' });
    expect(JSON.stringify(payload)).not.toContain('SS-PRIVATE-123');
    expect(JSON.stringify(payload)).not.toContain('order-1');
  });

  it('honors per-category preferences and removes expired subscriptions', async () => {
    await saveWebPushSubscription('user-1', subscription, {
      lowStockAlerts: true,
      orderStatusUpdates: false,
      deliveryDispatches: true,
    });
    const skipped = await sendWebPushEvent(event);
    expect(skipped).toEqual({ sent: 0, reason: 'no_subscriptions' });
    expect(webpush.sendNotification).not.toHaveBeenCalled();

    await saveWebPushSubscription('user-1', subscription, {
      lowStockAlerts: true,
      orderStatusUpdates: true,
      deliveryDispatches: true,
    });
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce(Object.assign(new Error('gone'), { statusCode: 410 }));
    expect(await sendWebPushEvent(event)).toEqual({ sent: 0 });
    expect(await sendWebPushEvent(event)).toEqual({ sent: 0, reason: 'no_subscriptions' });
  });
});
