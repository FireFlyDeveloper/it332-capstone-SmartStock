/* SmartStock background Web Push receiver. Payloads intentionally omit customer, order, and product identifiers. */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === 'string' ? payload.title : 'SmartStock update';
  const body = typeof payload.body === 'string' ? payload.body : 'Open SmartStock to review a new update.';
  const rawUrl = typeof payload.url === 'string' ? payload.url : '/';
  const url = rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? rawUrl : '/';
  const tag = typeof payload.tag === 'string' ? payload.tag.slice(0, 120) : 'smartstock-update';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag,
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const rawUrl = event.notification.data && typeof event.notification.data.url === 'string'
      ? event.notification.data.url
      : '/';
    const target = new URL(rawUrl, self.location.origin);
    if (target.origin !== self.location.origin) target.href = new URL('/', self.location.origin).href;

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      if ('navigate' in existing) await existing.navigate(target.href);
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});
