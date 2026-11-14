// Bani Adam service worker: pages work offline, the pose model is kept after the first download.
const SHELL = "ba-shell-v32";
const EXT = "ba-ext-v1";
const PAGES = ["/", "/game", "/boxing", "/mimic", "/coach", "/nogym", "/exercises", "/nutrition", "/ruh", "/css/sub.css", "/js/shared.js", "/js/nutri.js", "/js/protein.js", "/data/protein.json", "/js/train-extra.js", "/js/life.js", "/data/nogym.json", "/data/exercises.json", "/data/recipes.json", "/body/front.webp", "/body/back.webp", "/manifest.webmanifest", "/brand/favicon.svg", "/brand/cover.webp", "/brand/me-icon-192.png", "/brand/me-apple-touch.png"];
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
    if (url.pathname.startsWith("/data/")) {
      // content files (exercises, recipes): network first so new items show right away; cached copy when offline
      e.respondWith(fetch(req).then(async (res) => { if (res.ok) (await caches.open(SHELL)).put(req, res.clone()); return res; }).catch(() => caches.match(req)));
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

// تذكيرات من السيرفر (Web Push)
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
    // التطبيق مفتوح وظاهر: الصفحة بتعرض التذكير بنص الشاشة
    const open = all.filter((c) => c.visibilityState === "visible");
    if (open.length) { open.forEach((c) => c.postMessage({ type: "ba-reminder", d })); return; }
    return self.registration.showNotification(d.title || "مشروع بني آدم", {
    body: d.body || "", tag: d.tag || "ba", lang: "ar", dir: "rtl",
    icon: "/brand/icon-192.png", badge: "/brand/favicon.png", data: { url: d.url || "/" },
    vibrate: [200, 100, 200], renotify: true, silent: false, requireInteraction: !!d.big,
    });
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
    for (const c of all) if (new URL(c.url).origin === location.origin && "focus" in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
