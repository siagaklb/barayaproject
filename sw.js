// BARAYA PROJECT — Service Worker
// Cache-first untuk shell aplikasi, agar bisa dibuka walau offline / sinyal lemah.

const CACHE_NAME = 'baraya-finance-v1';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Hanya tangani GET request
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          // simpan salinan terbaru ke cache (same-origin saja)
          if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached); // offline: fallback ke cache

      // Strategi: tampilkan cache dulu jika ada (cepat), lalu update di background.
      return cached || networkFetch;
    })
  );
});
