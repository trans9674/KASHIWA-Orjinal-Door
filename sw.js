const CACHE_NAME = 'kashiwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  (event as any).waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  (event as any).respondWith(
    caches.match((event as any).request).then((response) => {
      return response || fetch((event as any).request);
    })
  );
});
