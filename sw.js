// LIFT Service Worker (Block 3, 28.11.2026)
// index.html: immer zuerst aus dem Netz (Updates kommen sofort an), offline aus dem Speicher.
// Icons/Manifest: aus dem Speicher. Google-Schriften: aus dem Speicher, im Hintergrund auffrischen.
var C = 'lift-v1';
var CORE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function put(req, res) {
  if (res && (res.ok || res.type === 'opaque')) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(req, cp); }); }
  return res;
}

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  var page = r.mode === 'navigate' || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname));
  if (page) {
    e.respondWith(fetch(r, { cache: 'no-store' }).then(function (res) { return put('./index.html', res); })
      .catch(function () { return caches.match('./index.html'); }));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(caches.match(r).then(function (m) { return m || fetch(r).then(function (res) { return put(r, res); }); }));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(function (m) {
      var net = fetch(r).then(function (res) { return put(r, res); }).catch(function () { return m; });
      return m || net;
    }));
  }
});
