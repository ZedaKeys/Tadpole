/// <reference lib="webworker" />

const CACHE_VERSION = '2.2.3';
const CACHE_NAME = `tadpole-v${CACHE_VERSION}`;

// Critical assets to pre-cache on install
const PRE_CACHE_URLS = [
  '/phone/',
  '/phone/manifest.json',
  '/phone/icons/icon-192.png',
  '/phone/icons/icon-512.png',
  '/phone/icons/icon-maskable-192.png',
  '/phone/icons/icon-maskable-512.png',
  '/phone/icons/apple-touch-icon-180.png',
];

// Static asset extensions — cache-first strategy
const STATIC_EXTENSIONS = [
  '.js', '.mjs', '.css', '.woff2', '.woff', '.ttf', '.otf',
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico',
  '.json', '.wasm',
];

/**
 * Determine if a request URL is for a static asset
 */
function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Determine if a request is a navigation (HTML page) request
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache critical assets — tolerant of individual failures
      return Promise.allSettled(
        PRE_CACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to pre-cache:', url, err);
          })
        )
      );
    }).then(() => {
      // Skip waiting so the new SW activates immediately
      return self.skipWaiting();
    })
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!request.url.startsWith('http')) return;

  // Skip Next.js dev-related paths
  if (request.url.includes('/_next/static/webpack') || request.url.includes('/_next/data')) {
    // Let Next.js internal requests go through normally
    // but still cache the responses for offline use
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Navigation requests: network-first, fallback to cached root page
  if (isNavigationRequest(request)) {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirstWithCache(request));
});

/**
 * Navigation handler: network first, fallback to cached /
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed — try exact cache match first
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to cached root page
    const rootCached = await caches.match('/phone/');
    if (rootCached) return rootCached;

    // Ultimate fallback
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tadpole</title></head><body><h1>Offline</h1><p>Tadpole is offline and no cached version is available.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return cached version if network failed
    const cached = await caches.match(request);
    if (cached) return cached;

    // For images, return empty response
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// ── Message handler ──────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
