// Service Worker for GroceryStore PWA & Web Push
const CACHE_NAME = 'grocery-store-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Обработка входящего Push-уведомления
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Супермаркет', body: event.data.text() };
    }
  }

  const title = data.title || 'Супермаркет «Свежие продукты»';
  const options = {
    body: data.body || 'Новое уведомление о вашем заказе',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'grocery-order-update',
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || (data.data && data.data.url) || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка нажатия на Push-уведомление
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если вкладка магазина уже открыта, переключаемся на нее и переходим по ссылке
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Иначе открываем новое окно
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
