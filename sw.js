// LCCA Software Service Worker - Network First Strategy
const CACHE_NAME = 'lcca-nigeria-v4.1.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './css/main.css',
  './css/components.css',
  './css/print.css',
  './js/app.js',
  './js/pwa.js',
  './js/data.js',
  './js/lcca.js',
  './js/sizing.js',
  './js/report.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback for offline usage
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
