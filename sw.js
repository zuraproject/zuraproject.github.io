const CACHE_NAME = 'zura-shell-v1';
const ASSETS = [
  'index.html',
  'styles.css',
  'scripts/db.js',
  'scripts/pwa-app.js',
  'manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>null)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE_NAME?null:caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(()=>caches.match('index.html')));
    return;
  }
  if (req.method==='GET') {
    event.respondWith(caches.match(req).then(c=>c||fetch(req).then(res=>{ caches.open(CACHE_NAME).then(cache=>cache.put(req,res.clone())); return res; }).catch(()=>c)));
  }
});
