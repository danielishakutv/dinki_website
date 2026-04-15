// Dinki.africa Service Worker — Cache-first for assets, network-first for API
const CACHE_NAME = 'dinki-v1';
const API_ORIGIN = 'https://be.dinki.africa';

// Pre-cache the app shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/favicon.svg', '/manifest.json'])
    )
  );
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests — network-first with no caching (useApi handles in-memory SWR)
  if (url.origin === API_ORIGIN) return;

  // Navigation requests — serve cached index.html (SPA fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
