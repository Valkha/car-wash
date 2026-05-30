const CACHE = 'ccw-v2';
const PRECACHE = [
  '/',
  '/en/',
  '/assets/css/tailwind-src.css',
  '/assets/images/hero-bg-opt.webp',
  '/assets/images/hero-bg-mobile.webp',
  '/assets/images/logo-v2-tiny.webp',
  '/assets/images/logo-mobile.webp',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Network-only bypass for local dev (Vite dev server + HMR)
  const url = e.request.url;
  if (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('/@vite/') ||
    url.includes('/@fs/') ||
    url.includes('/__vite') ||
    url.includes('?t=') // Vite HMR timestamp query
  ) {
    return fetch(e.request);
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/'));
    })
  );
});
