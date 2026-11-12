// Bite Buddy service worker (plain JS: it is served as-is from /public).
// - Pages: network first, falling back to the cached copy, then to /offline.
// - Build assets and icons: cache first (their URLs change when the content changes).
// - Food searches (GET /api/foods): network first with a cached fallback.
// Other API requests are never cached. Caches are cleared on sign-out (see "clear-user-cache").

const VERSION = "v1";
const STATIC_CACHE = `bitebuddy-static-${VERSION}`;
const PAGES_CACHE = `bitebuddy-pages-${VERSION}`;
const DATA_CACHE = `bitebuddy-data-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];
const MAX_PAGES = 60;
const MAX_DATA = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, PAGES_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-user-cache") {
    event.waitUntil(Promise.all([caches.delete(PAGES_CACHE), caches.delete(DATA_CACHE)]));
  }
});

const trim = async (cacheName, max) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
};

const networkFirst = async (request, cacheName, max, fallbackUrl) => {
  try {
    const response = await fetch(request);
    // Only successful, same-origin, non-redirected responses are stored (not the sign-in redirect).
    if (response.ok && !response.redirected && response.type === "basic") {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      void trim(cacheName, max);
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return Response.error();
  }
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Full page loads. Client-side navigations (RSC requests) go straight to the network.
  if (request.mode === "navigate") {
    if (url.pathname.startsWith("/api/") || url.pathname === "/sign-in") return;
    event.respondWith(networkFirst(request, PAGES_CACHE, MAX_PAGES, OFFLINE_URL));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname === "/api/foods") {
    event.respondWith(networkFirst(request, DATA_CACHE, MAX_DATA));
  }
});
