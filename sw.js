// Bani Adam service worker: pages work offline, the pose model is kept after the first download.
const SHELL = "ba-shell-v8";
const EXT = "ba-ext-v1";
const PAGES = ["/", "/game", "/boxing", "/mimic", "/coach", "/manifest.webmanifest", "/brand/favicon.svg", "/brand/app-icon.png", "/brand/icon-192.png"];
const EXT_HOSTS = ["cdn.jsdelivr.net", "storage.googleapis.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  // one missing file must not stop the install
  e.waitUntil(caches.open(SHELL).then((c) => Promise.allSettled(PAGES.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, EXT].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// A redirected response can't answer a navigation, so store a clean copy.
const clean = async (res) => (res.redirected ? new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers }) : res);
const pageKey = (url) => { const u = new URL(url); let p = u.pathname.replace(/\.html$/, ""); if (p === "/index") p = "/"; return p; };

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // sync calls go straight to the network
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate") {
      // network first, so updates arrive; the cached page when offline
      e.respondWith(fetch(req).then(async (res) => { const c = await clean(res); if (c.ok) (await caches.open(SHELL)).put(pageKey(req.url), c.clone()); return c; })
        .catch(async () => (await caches.match(pageKey(req.url))) || (await caches.match("/"))));
      return;
    }
    e.respondWith(caches.match(req).then((hit) => {
      const net = fetch(req).then(async (res) => { if (res.ok) (await caches.open(SHELL)).put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (EXT_HOSTS.includes(url.hostname)) {
    // pinned library versions, the pose model and fonts: cache first
    e.respondWith(caches.open(EXT).then(async (c) => (await c.match(req)) || fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; })));
  }
});
