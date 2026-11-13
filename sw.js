// Склейка: keeps the last opened copy so the app also starts without internet.
// The network is always tried first, so a new version on GitHub is picked up right away.
// If the start address is missing (for example the file was renamed), the last opened page is shown instead of an error.
const CACHE = 'sklejka-2', LAST = '__last_page__';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  const page = r.mode === 'navigate';
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => { c.put(r, copy.clone()).catch(() => {}); if (page) c.put(LAST, copy).catch(() => {}); }).catch(() => {});
        return res;
      }
      if (page) return caches.match(LAST).then(hit => hit || res);
      return res;
    }).catch(() => caches.match(r).then(hit => hit || (page ? caches.match(LAST) : undefined)))
  );
});
