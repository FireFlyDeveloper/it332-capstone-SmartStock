import * as webpush from 'web-push';
import { getPool } from '../db/client.js';
import { isDbSyncActive } from '../db/syncState.js';
import type { NotificationEvent } from './types.js';

export interface WebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface WebPushPreferences {
  lowStockAlerts: boolean;
  orderStatusUpdates: boolean;
  deliveryDispatches: boolean;
}

interface StoredSubscription {
  userId: string;
  subscription: WebPushSubscription;
  preferences: WebPushPreferences;
}

const DEFAULT_PREFERENCES: WebPushPreferences = {
  lowStockAlerts: true,
  orderStatusUpdates: true,
  deliveryDispatches: true,
};
const memorySubscriptions = new Map<string, StoredSubscription>();

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY?.trim()
    && process.env.VAPID_PRIVATE_KEY?.trim()
    && process.env.VAPID_SUBJECT?.trim(),
  );
}

export function getWebPushPublicKey(): string | null {
  return isWebPushConfigured() ? process.env.VAPID_PUBLIC_KEY!.trim() : null;
}

function validatePushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    const supportedHost = host === 'fcm.googleapis.com'
      || host.endsWith('.push.services.mozilla.com')
      || host === 'push.services.mozilla.com'
      || host.endsWith('.push.apple.com')
      || host.endsWith('.notify.windows.com');
    return url.protocol === 'https:'
      && supportedHost
      && !url.username
      && !url.password
      && (!url.port || url.port === '443')
      && url.pathname.length > 1
      && endpoint.length <= 2048;
  } catch {
    return false;
  }
}

export function isValidWebPushSubscription(value: unknown): value is WebPushSubscription {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WebPushSubscription>;
  return typeof candidate.endpoint === 'string'
    && validatePushEndpoint(candidate.endpoint)
    && Boolean(candidate.keys)
    && typeof candidate.keys?.p256dh === 'string'
    && candidate.keys.p256dh.length > 0
    && candidate.keys.p256dh.length <= 512
    && typeof candidate.keys.auth === 'string'
    && candidate.keys.auth.length > 0
    && candidate.keys.auth.length <= 512
    && (candidate.expirationTime === undefined || candidate.expirationTime === null || typeof candidate.expirationTime === 'number');
}

export function normalizeWebPushPreferences(value: unknown): WebPushPreferences | null {
  if (value === undefined) return { ...DEFAULT_PREFERENCES };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_PREFERENCES)) {
    if (input[key] !== undefined && typeof input[key] !== 'boolean') return null;
  }
  return {
    lowStockAlerts: input.lowStockAlerts !== false,
    orderStatusUpdates: input.orderStatusUpdates !== false,
    deliveryDispatches: input.deliveryDispatches !== false,
  };
}

export async function saveWebPushSubscription(
  userId: string,
  subscription: WebPushSubscription,
  preferences: WebPushPreferences,
): Promise<void> {
  const pool = isDbSyncActive() ? getPool() : null;
  if (isDbSyncActive() && !pool) throw new Error('Push subscription storage is unavailable');
  if (pool) {
    await pool.query(`
      INSERT INTO web_push_subscriptions (user_id, endpoint, subscription_json, preferences_json)
      VALUES ($1, $2, $3::jsonb, $4::jsonb)
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        subscription_json = EXCLUDED.subscription_json,
        preferences_json = EXCLUDED.preferences_json,
        updated_at = NOW()
    `, [userId, subscription.endpoint, JSON.stringify(subscription), JSON.stringify(preferences)]);
    return;
  }
  memorySubscriptions.set(subscription.endpoint, { userId, subscription, preferences });
}

export async function removeWebPushSubscription(userId: string, endpoint: string): Promise<void> {
  const pool = isDbSyncActive() ? getPool() : null;
  if (isDbSyncActive() && !pool) throw new Error('Push subscription storage is unavailable');
  if (pool) {
    await pool.query('DELETE FROM web_push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
    return;
  }
  const existing = memorySubscriptions.get(endpoint);
  if (existing?.userId === userId) memorySubscriptions.delete(endpoint);
}

async function listWebPushSubscriptions(): Promise<StoredSubscription[]> {
  const pool = isDbSyncActive() ? getPool() : null;
  if (isDbSyncActive() && !pool) throw new Error('Push subscription storage is unavailable');
  if (pool) {
    const { rows } = await pool.query('SELECT user_id, subscription_json, preferences_json FROM web_push_subscriptions');
    return rows.map((row) => ({
      userId: String(row.user_id),
      subscription: (typeof row.subscription_json === 'string' ? JSON.parse(row.subscription_json) : row.subscription_json) as WebPushSubscription,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(typeof row.preferences_json === 'string' ? JSON.parse(row.preferences_json) : row.preferences_json),
      },
    }));
  }
  return Array.from(memorySubscriptions.values());
}

function pushMessage(event: NotificationEvent): { title: string; body: string; url: string; tag: string } {
  switch (event.type) {
    case 'inventory.low_stock':
      return { title: 'Inventory alert', body: 'A stock item needs attention. Open SmartStock to review.', url: '/inventory', tag: 'stock-update' };
    case 'order.status_changed':
      return { title: 'Order update', body: 'An order status changed. Open SmartStock to review.', url: '/orders', tag: 'order-update' };
    case 'delivery.status_changed':
      return { title: 'Delivery update', body: 'A delivery status changed. Open SmartStock to review.', url: '/delivery', tag: 'delivery-update' };
  }
}

function preferenceEnabled(event: NotificationEvent, preferences: WebPushPreferences): boolean {
  if (event.type === 'inventory.low_stock') return preferences.lowStockAlerts;
  if (event.type === 'delivery.status_changed') return preferences.deliveryDispatches;
  return preferences.orderStatusUpdates;
}

function configureWebPush(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) throw new Error('Web Push is not configured');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function deliver(subscriptions: StoredSubscription[], payload: { title: string; body: string; url: string; tag: string }): Promise<number> {
  let sent = 0;
  for (const entry of subscriptions) {
    try {
      await webpush.sendNotification(entry.subscription, JSON.stringify(payload), { TTL: 60 * 60 });
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await removeWebPushSubscription(entry.userId, entry.subscription.endpoint);
      } else {
        console.warn(`[notifications] Web Push delivery failed (${statusCode ?? 'network'}); subscription retained`);
      }
    }
  }
  return sent;
}

export async function sendWebPushEvent(event: NotificationEvent): Promise<{ sent: number; reason?: string }> {
  if (!isWebPushConfigured()) return { sent: 0, reason: 'not_configured' };
  try {
    configureWebPush();
    const subscriptions = (await listWebPushSubscriptions()).filter((entry) => preferenceEnabled(event, entry.preferences));
    if (!subscriptions.length) return { sent: 0, reason: 'no_subscriptions' };
    return { sent: await deliver(subscriptions, pushMessage(event)) };
  } catch {
    console.warn('[notifications] Web Push event delivery failed');
    return { sent: 0, reason: 'delivery_error' };
  }
}

export async function sendWebPushTest(userId: string): Promise<{ sent: number; reason?: string }> {
  if (!isWebPushConfigured()) return { sent: 0, reason: 'not_configured' };
  try {
    configureWebPush();
    const subscriptions = (await listWebPushSubscriptions()).filter((entry) => entry.userId === userId);
    if (!subscriptions.length) return { sent: 0, reason: 'no_subscriptions' };
    return {
      sent: await deliver(subscriptions, {
        title: 'SmartStock test notification',
        body: 'Push notifications are connected for this browser.',
        url: '/profile?tab=notifications',
        tag: 'smartstock-push-test',
      }),
    };
  } catch {
    console.warn('[notifications] Web Push test delivery failed');
    return { sent: 0, reason: 'delivery_error' };
  }
}

export function _resetWebPushSubscriptions(): void {
  memorySubscriptions.clear();
}
