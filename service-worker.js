/**
 * service-worker.js
 * Responsabilidad: habilitar funcionamiento offline básico (App Shell caching).
 *
 * Estrategia:
 * - Network-first para el código de la app (HTML/JS/CSS/JSON): siempre intenta
 *   traer la versión más nueva del servidor primero, y solo usa la copia en
 *   caché si no hay conexión. Esto es clave mientras la app sigue en
 *   desarrollo activo — con "cache-first" (la estrategia anterior), una vez
 *   que un archivo quedaba cacheado, el navegador lo servía para siempre sin
 *   volver a chequear el servidor, así se subieran cambios nuevos a GitHub.
 * - Cache-first para íconos/imágenes: cambian poco, no hace falta red cada vez.
 *
 * IMPORTANTE: cada vez que se suba una actualización importante de la app,
 * conviene subir el número de CACHE_NAME (v2, v3...) — eso fuerza a limpiar
 * la caché vieja de quienes ya habían visitado el sitio antes.
 */

const CACHE_NAME = 'franthina-shell-v2';
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

/** Extensiones de assets que cambian poco: se sirven cache-first. Todo lo demás (HTML/JS/CSS/JSON) es network-first. */
const CACHE_FIRST_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'];

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
  if (!event.request.url.startsWith(self.location.origin)) return;

  const isCacheFirst = CACHE_FIRST_EXTENSIONS.some((ext) => event.request.url.endsWith(ext));

  if (isCacheFirst) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }))
    );
    return;
  }

  // Network-first: prueba la red primero (siempre la versión más nueva);
  // si falla (sin conexión), recién ahí usa lo que haya en caché.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match(new URL('./index.html', self.registration.scope).href))
      )
  );
});
