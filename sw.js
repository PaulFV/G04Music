/* G04Musik — Service Worker: legt die App-Dateien ab, damit sie offline startet.
   Musik, Sender und Videos kommen nicht hier hinein (eigene Dateien liegen in der IndexedDB). */
var CACHE = 'g04musik-v0.1.2';
var FILES = [
  './', 'index.html', 'manifest.webmanifest?v=3',
  'css/theme.css', 'css/layout.css', 'css/components.css', 'css/player.css', 'css/responsive.css',
  'js/util.js', 'js/db.js', 'js/id3.js', 'js/store.js', 'js/library.js', 'js/radio.js', 'js/youtube.js',
  'js/player.js', 'js/views.js', 'js/app.js',
  'img/icon-192.png?v=3', 'img/icon-512.png?v=3', 'img/icon-180.png?v=3', 'img/favicon-32.png?v=3', 'img/icon-maskable-512.png?v=3', 'img/icon.svg?v=3', 'img/icon-96.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* Nur eigene App-Dateien: zuerst Netz (damit Updates sofort da sind), sonst Ablage */
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.headers.has('range')) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()); });
    })
  );
});
