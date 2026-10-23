/* G04Musik — Service Worker: legt die App-Dateien ab, damit sie offline startet.
   Musik, Sender und Videos kommen nicht hier hinein (eigene Dateien liegen in der IndexedDB). */
var CACHE = 'g04musik-v0.6.11';
var FILES = [
  './', 'index.html', 'manifest.webmanifest?v=6',
  'css/theme.css?v=0.6.11', 'css/layout.css?v=0.6.11', 'css/components.css?v=0.6.11', 'css/player.css?v=0.6.11', 'css/responsive.css?v=0.6.11', 'css/theme-light.css?v=0.6.11',
  'js/util.js?v=0.6.11', 'js/i18n.js?v=0.6.11', 'js/db.js?v=0.6.11', 'js/id3.js?v=0.6.11', 'js/store.js?v=0.6.11', 'js/library.js?v=0.6.11', 'js/radio.js?v=0.6.11', 'js/nowplaying.js?v=0.6.11', 'js/youtube.js?v=0.6.11', 'js/playlists.js?v=0.6.11',
  'js/player.js?v=0.6.11', 'js/pip.js?v=0.6.11', 'js/views.js?v=0.6.11', 'js/app.js?v=0.6.11',
  'img/icon-192.png?v=6', 'img/icon-512.png?v=6', 'img/icon-180.png?v=6', 'img/favicon-32.png?v=6', 'img/icon-maskable-512.png?v=6', 'img/icon.svg?v=6', 'img/icon-96.png'
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
    /* cache:'no-cache' = beim Server nachfragen, statt bis zu 10 Minuten alte Dateien zu nehmen */
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()); });
    })
  );
});
