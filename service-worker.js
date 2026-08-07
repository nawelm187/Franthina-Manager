/**
 * service-worker.js
 * Responsabilidad: habilitar funcionamiento offline básico (App Shell caching).
 * Estrategia: cache-first para los archivos estáticos de la aplicación,
 * network-first implícito para cualquier recurso no cacheado.
 * Este es el punto de partida para sincronización y notificaciones futuras.
 */

const CACHE_NAME = 'franthina-shell-v1';
// Rutas relativas al scope real del service worker: así funciona tanto en la
// raíz de un dominio como en un subdirectorio (ej. GitHub Pages project site).
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './design-system/tokens.css',
  './design-system/base.css',
  './design-system/components.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const urls = APP_SHELL.map((path) => new URL(path, self.registration.scope).href);
      return cache.addAll(urls);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cachea también los módulos de features (lazy loaded) a medida que se visitan,
        // así la segunda visita a una pantalla ya funciona offline.
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => caches.match(new URL('./index.html', self.registration.scope).href));
    })
  );
});
