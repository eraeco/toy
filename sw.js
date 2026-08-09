self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((all) => {
    return Promise.all(all.map((k) => caches.delete(k)));
  }).then(() => self.clients.claim()).then(() => {
    return self.clients.matchAll({type: 'window'});
  }).then((all) => {
    // pages loaded from a stale cache heal themselves: one reload, now through this SW
    all.forEach((c) => { if(c.navigate){ c.navigate(c.url) } });
  }));
});

self.addEventListener('fetch', (e) => {
  var u = new URL(e.request.url);
  if(u.origin !== location.origin || e.request.method !== 'GET'){ return }
  // bust every cache layer (browser + CDN edge); the server ignores the query
  u.searchParams.set('t', Date.now());
  e.respondWith(fetch(new Request(u, {cache: 'no-store'})).catch(() => fetch(e.request)));
});
