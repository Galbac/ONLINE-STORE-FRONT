// Service Worker for GroceryStore PWA & Web Push
const CACHE_NAME = "grocery-store-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/badge-72x72.png"
];

// Offline fallback HTML
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Нет интернета — Grocery Store</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
      text-align: center;
      box-sizing: border-box;
    }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 380px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; }
    p { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px; }
    button {
      background: #059669;
      color: white;
      border: none;
      border-radius: 14px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
    }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Нет подключения к сети</h1>
    <p>Проверьте интернет-соединение. Ваши выбранные товары сохранены в корзине.</p>
    <button onclick="window.location.reload()">Повторить попытку</button>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      cache.put("/offline-fallback", new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }));
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Failed caching some static assets:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
    ])
  );
});

// Network-First стратегия с Fallback для навигации
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Не кэшируем запросы к API, админке и не-GET
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.includes("/sw.js")
  ) {
    return;
  }

  // Навигация (переход по страницам)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/offline-fallback");
          return fallback || new Response("Офлайн режим", { status: 503 });
        })
    );
    return;
  }

  // Статические ресурсы (иконки, стили)
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
  }
});

// Обработка входящего Push-уведомления
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Супермаркет", body: event.data.text() };
    }
  }

  const title = data.title || "Супермаркет «Свежие продукты»";
  const options = {
    body: data.body || "Новое уведомление о вашем заказе",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    tag: data.tag || "grocery-order-update",
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || (data.data && data.data.url) || "/",
      timestamp: Date.now(),
    },
    actions: [
      { action: "open", title: "Открыть" },
      { action: "close", title: "Закрыть" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка нажатия на Push-уведомление
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
