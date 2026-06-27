const CACHE_NAME = 'scdnr-tag-logging-v19';

const STATIC_ASSETS = [
  './manifest.json',
  './assets/scdnr-tagging-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
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

function isAppShell(url) {
  try {
    const { pathname } = new URL(url);
    if (pathname.endsWith('/') || pathname.endsWith('/index.html')) return true;
    return /\/js\/[^/]+\.js$/.test(pathname) || pathname.endsWith('/config.js');
  } catch {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // Never cache HTML/JS — always fetch fresh app code (fixes stale mobile UI).
  if (isAppShell(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && STATIC_ASSETS.some((asset) => url.includes(asset.replace('./', '')))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
