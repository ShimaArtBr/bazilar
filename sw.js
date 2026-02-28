/**
 * BAZILAR — Service Worker
 * Offline-first PWA with cache-first strategy for app shell
 */

const CACHE_NAME    = 'bazilar-v1.0.0';
const RUNTIME_CACHE = 'bazilar-runtime-v1';

// App shell — core files cached on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/engine.js',
  '/i18n.js',
  '/geo.js',
  '/app.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// External resources to cache at runtime
const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// ─── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  const keepCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => !keepCaches.includes(key)).map(key => {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Geocoding API (Nominatim, timeapi.io) — network first, no cache
  if (url.hostname === 'nominatim.openstreetmap.org' ||
      url.hostname === 'timeapi.io') {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Google Fonts — cache first
  if (FONT_ORIGINS.some(o => request.url.startsWith(o))) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // App shell — cache first, fallback to network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response.ok) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      }).catch(() => {
        // Return offline fallback
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ─── BACKGROUND SYNC (future) ──────────────────────────────────
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
});

// ─── PUSH NOTIFICATIONS (future) ──────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || 'Bazilar', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
  });
});
