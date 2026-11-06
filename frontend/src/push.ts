import {
  deleteWebPushSubscription,
  saveWebPushSubscription,
  type WebPushPreferences,
  type WebPushSubscriptionData,
} from './api'

export function supportsWebPush(): boolean {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
}

function decodeApplicationServerKey(encodedKey: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - encodedKey.length % 4) % 4)
  const base64 = (encodedKey + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

export async function registerWebPush(
  publicKey: string,
  preferences: WebPushPreferences,
): Promise<PushSubscription> {
  if (!supportsWebPush()) throw new Error('This browser cannot receive background push notifications.')
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(publicKey),
    })
  }
  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error('The browser returned an incomplete push subscription.')
  }
  const data: WebPushSubscriptionData = {
    endpoint: serialized.endpoint,
    expirationTime: serialized.expirationTime,
    keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth },
  }
  await saveWebPushSubscription(data, preferences)
  return subscription
}

export async function unregisterWebPush(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await deleteWebPushSubscription(endpoint)
}

export async function syncWebPushPreferences(preferences: WebPushPreferences): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return false
  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error('The browser returned an incomplete push subscription.')
  }
  await saveWebPushSubscription({
    endpoint: serialized.endpoint,
    expirationTime: serialized.expirationTime,
    keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth },
  }, preferences)
  return true
}
