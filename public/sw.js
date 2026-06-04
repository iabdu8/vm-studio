// ============================================================
//  VM-STUDIO SERVICE WORKER v2
//  Handles: offline cache + push notifications + background sync
// ============================================================

const CACHE    = "vm-studio-v2";
const PRECACHE = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("supabase.co")) return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/")))
  );
});

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title:"VM-Studio", body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title ?? "VM-Studio", {
      body: data.body ?? "", icon: "/icon-192.png", badge: "/icon-192.png",
      tag: data.tag ?? "vm-studio", data: data.data ?? {}, vibrate: [200,100,200],
      requireInteraction: data.requireInteraction ?? false,
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then(all => {
      const ex = all.find(c => c.url.includes(url));
      return ex ? ex.focus() : clients.openWindow(url);
    })
  );
});

self.addEventListener("sync", (e) => {
  if (e.tag === "sync-submissions") {
    e.waitUntil(
      self.clients.matchAll().then(cs =>
        cs.forEach(c => c.postMessage({ type:"TRIGGER_SYNC" }))
      )
    );
  }
});
