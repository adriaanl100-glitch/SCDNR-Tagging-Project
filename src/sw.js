const CACHE_NAME = 'scdnr-tag-logging-v16';

/** App shell files — always prefer network so UI fixes reach users quickly. */
const NETWORK_FIRST = [
  './',
  './index.html',
  './js/app.js',
  './js/map.js',
  './js/sync.js',
  './js/storage.js',
  './js/validation.js',
  './js/species.js',
  './js/grid.js',
  './js/image.js',
  './js/export.js'
];

const CACHE_FIRST = [
  './manifest.json',
  './assets/scdnr-tagging-logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FIRST).catch(() => {}))
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

function isNetworkFirst(url) {
  try {
    const { pathname } = new URL(url);
    if (pathname.endsWith('/') || pathname.endsWith('/index.html')) return true;
    return /\/js\/(app|map|sync|storage|validation|species|grid|image|export)\.js$/.test(pathname);
  } catch {
    return false;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (url.includes('config.js')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    isNetworkFirst(url) ? networkFirst(event.request) : cacheFirst(event.request)
  );
});
