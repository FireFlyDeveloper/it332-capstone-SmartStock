import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { signToken } from '../auth/jwt.js';
import { createUser, _resetUserStore } from '../auth/users.js';
import { setDbSyncActive } from '../db/syncState.js';
import { notificationRoutes } from './routes.js';
import { _resetWebPushSubscriptions } from './push.js';

const app = new Hono();
app.route('/notifications', notificationRoutes);

const pushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/example-endpoint-token',
  expirationTime: null,
  keys: {
    p256dh: 'BNcRdreALRFXTkO4t4a-p9OQaw2xH5gKqB4k-0xF9T0',
    auth: 'a-secret-auth-key',
  },
};

async function staffHeaders() {
  const user = await createUser({
    email: 'push-test@example.test',
    name: 'Push Test',
    passwordHash: 'not-used-by-this-test',
    role: 'staff',
  });
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

describe('authenticated Web Push endpoints', () => {
  beforeEach(() => {
    _resetUserStore();
    _resetWebPushSubscriptions();
    setDbSyncActive(false);
    vi.stubEnv('VAPID_PUBLIC_KEY', 'test-public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'test-private-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:push-test@example.test');
  });

  afterEach(() => {
    setDbSyncActive(false);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('requires authentication and never returns the private VAPID key', async () => {
    expect((await app.request('/notifications/push/config')).status).toBe(401);
    const headers = await staffHeaders();
    const response = await app.request('/notifications/push/config', { headers });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ configured: true, publicKey: 'test-public-key' });
  });

  it('refuses subscriptions when VAPID delivery is not configured', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    const headers = await staffHeaders();
    const response = await app.request('/notifications/push/subscriptions', {
      method: 'POST', headers,
      body: JSON.stringify({ subscription: pushSubscription }),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'push_not_configured' });
  });

  it('validates subscription origin and stores a browser subscription for its user', async () => {
    const headers = await staffHeaders();
    const invalid = await app.request('/notifications/push/subscriptions', {
      method: 'POST', headers,
      body: JSON.stringify({ subscription: { ...pushSubscription, endpoint: 'http://127.0.0.1/private' } }),
    });
    expect(invalid.status).toBe(400);

    const saved = await app.request('/notifications/push/subscriptions', {
      method: 'POST', headers,
      body: JSON.stringify({
        subscription: pushSubscription,
        preferences: { lowStockAlerts: true, orderStatusUpdates: false, deliveryDispatches: true },
      }),
    });
    expect(saved.status).toBe(201);
    expect(await saved.json()).toMatchObject({ ok: true });
  });

  it('removes only the authenticated user’s own subscription', async () => {
    const headers = await staffHeaders();
    await app.request('/notifications/push/subscriptions', {
      method: 'POST', headers,
      body: JSON.stringify({ subscription: pushSubscription }),
    });
    const removed = await app.request('/notifications/push/subscriptions', {
      method: 'DELETE', headers,
      body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
    });
    expect(removed.status).toBe(200);
    expect(await removed.json()).toMatchObject({ ok: true });
  });
});
