/**
 * Dinki.africa service worker.
 *
 * The app's data is handled entirely by IndexedDB and the sync engine, so this
 * worker has one job: make sure the app itself loads with no network. It never
 * caches API responses — doing so would put a second, stale copy of the data
 * behind the local database and the two would disagree.
 */

// Bump to invalidate every cached asset at once.
const VERSION = 'v2';
const SHELL_CACHE = `dinki-shell-${VERSION}`;
const ASSET_CACHE = `dinki-assets-${VERSION}`;
const IMAGE_CACHE = `dinki-images-${VERSION}`;

const API_ORIGIN = 'https://be.dinki.africa';

// Cheap phones run out of storage, and photos are the only thing here big enough
// to matter. Capping the image cache keeps the app from becoming the reason a
// user can't take a picture.
const MAX_IMAGES = 120;

const SHELL = ['/', '/favicon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // addAll fails the whole install if any single entry 404s, which would
      // leave the user with no offline shell at all.
      Promise.allSettled(SHELL.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Evict oldest-first once the cache exceeds its cap. */
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

function isImage(request, url) {
  return request.destination === 'image' || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // API traffic is never cached. The local database is the offline story; a
  // second stale copy here would only create disagreements about the truth.
  if (url.origin === API_ORIGIN) return;

  // Only same-origin assets. Cross-origin (fonts, analytics) go straight to the
  // network so a failure there can never poison the cache.
  if (url.origin !== self.location.origin) return;

  // Navigations: network first so a deploy is picked up promptly, falling back
  // to the cached shell. The SPA then boots from IndexedDB.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/', clone));
          return res;
        })
        .catch(() => caches.match('/', { cacheName: SHELL_CACHE }).then((r) => r || caches.match('/')))
    );
    return;
  }

  if (isImage(request, url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(IMAGE_CACHE).then(async (c) => {
                await c.put(request, clone);
                await trimCache(IMAGE_CACHE, MAX_IMAGES);
              });
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Built JS/CSS carry content hashes, so a cache hit is always correct and a
  // background refresh is only needed for unhashed files.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
