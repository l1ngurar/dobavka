const CACHE_PREFIX = "dobavka-shell-" + new URL(self.registration.scope).pathname + "-";
const CACHE_NAME = CACHE_PREFIX + "v1";
const APP_URL = new URL("./", self.location.href).href;
const ASSETS = [
  "./", "./index.html", "./pwa.js", "./manifest.webmanifest", "./favicon.svg",
  "./icons/icon-192.png", "./icons/icon-512.png",
  "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"
].map(path => new URL(path, self.location.href).href);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: "reload" })))));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const isPage = request.mode === "navigate" &&
    (url.pathname === new URL(APP_URL).pathname || url.pathname === new URL("./index.html", APP_URL).pathname);
  const assetUrl = new URL(url.pathname, url.origin).href;
  if (!isPage && !ASSETS.includes(assetUrl)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request, { cache: "no-cache" });
      if (response.ok && response.type === "basic") {
        const key = isPage ? APP_URL : assetUrl;
        event.waitUntil(cache.put(key, response.clone()).catch(() => {}));
        return response;
      }
      return await cache.match(isPage ? APP_URL : assetUrl) || response;
    } catch (error) {
      const cached = await cache.match(isPage ? APP_URL : assetUrl);
      if (cached) return cached;
      throw error;
    }
  })());
});
