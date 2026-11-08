const CACHE = "spiagiro-1794123930152";
const ASSETS = ["./assets/fraunces-latin-600-normal-BFCDtZfi.woff2","./assets/fraunces-latin-600-normal-DL5QCzvS.woff","./assets/index-BEPC-Q2_.css","./assets/index-Dtu2pnMn.js","./assets/maplibre-gl-BUwiJpK_.js","./assets/maplibre-gl-qvkd0SPb.css","./assets/maplibre-gl-worker-CZtFQQIV.mjs","./assets/maplibre-gl-worker-C_ThD4al.js","./assets/outfit-latin-400-normal-BGsTXAXT.woff2","./assets/outfit-latin-400-normal-DMwTpYkH.woff","./assets/outfit-latin-500-normal-ClnHRwRh.woff","./assets/outfit-latin-500-normal-DKnIMDSk.woff2","./assets/outfit-latin-700-normal-Cu9v6i1X.woff2","./assets/outfit-latin-700-normal-D4itBLBr.woff","./data/journeys.json","./data/meta.json","./data/motion.json","./data/network.json","./favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const direct = await cache.match(request, { ignoreVary: true, ignoreSearch: true });
  if (direct) return direct;
  const path = new URL(request.url).pathname;
  const keys = await cache.keys();
  for (const key of keys) {
    if (new URL(key.url).pathname === path) {
      const hit = await cache.match(key);
      if (hit) return hit;
    }
  }
  if (request.mode === "navigate") {
    const index = keys.find((key) => new URL(key.url).pathname.endsWith("/index.html"));
    if (index) return cache.match(index);
  }
  return undefined;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(
    (async () => {
        if (event.request.mode === "navigate") {
          try {
            const fresh = await fetch(event.request);
            const shell = !/\/(it|en|es|de)\//.test(url.pathname) && (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"));
            if (shell) {
              const cache = await caches.open(CACHE);
              cache.put("./index.html", fresh.clone());
            }
            return fresh;
          } catch {
            return (await fromCache(event.request)) || Response.error();
          }
        }
      const cached = await fromCache(event.request);
      if (cached) return cached;
      return fetch(event.request);
    })(),
  );
});
