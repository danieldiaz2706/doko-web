// DOKO Cocina — service worker: permite instalar el panel y abrirlo aunque falle el internet.
// Siempre intenta la red primero para que los cambios de la carta lleguen enseguida.
const CACHE = 'doko-cocina-v3';
const ARCHIVOS = ['./', './index.html', './cocina.css', './cocina.js', './datos.js', './reporte.js', './sonido.js', './config.js', './manifest.webmanifest', '../js/menu.js', '../assets/img/logo-128.png', '../assets/img/logo-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Solo archivos propios; Firebase maneja su propia conexión
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
