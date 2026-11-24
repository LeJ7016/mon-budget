// Mon Budget — service worker : fonctionnement hors ligne
const V = 'mon-budget-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); } return res; };

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);

  // Page : réponse immédiate depuis le cache, mise à jour en arrière-plan
  if (r.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(m => {
      const net = fetch(r).then(res => put('./index.html', res)).catch(() => m);
      return m || net;
    }));
    return;
  }

  // Fichiers de l'application et polices : cache d'abord
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => put(r, res))));
  }
});
