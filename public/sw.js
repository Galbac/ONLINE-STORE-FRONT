// Service Worker for GroceryStore PWA & Web Push
const CACHE_NAME = "grocery-store-cache-v3";
const STATIC_ASSETS = [
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/badge-72x72.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
      // Purge ALL caches on localhost or version update
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("grocery-store-cache-") && key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
    ])
  );
});

// Fetch handler: DO NOT intercept on localhost or for Next.js internal chunks
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never cache or intercept on localhost or 127.0.0.1
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return;
  }

  // 2. Never cache API, admin, or Next.js static/chunk bundles
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.includes("/sw.js")
  ) {
    return;
  }

  // 3. Static image assets only (icons, png, svg)
  if (
    url.pathname.startsWith("/icons/") ||
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

// Push notification listener
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
