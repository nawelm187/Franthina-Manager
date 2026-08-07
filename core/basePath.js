/**
 * basePath.js
 * Responsabilidad: resolver rutas lógicas de la app (ej. "/productos") contra
 * el subdirectorio real donde está desplegada la aplicación.
 *
 * Esto es necesario porque GitHub Pages sirve los "project sites" bajo un
 * subdirectorio (https://usuario.github.io/repo/) en lugar de la raíz del
 * dominio. Todo el resto de la app (router, config de rutas, estado) sigue
 * trabajando con rutas "lógicas" que empiezan en "/"; este módulo es el único
 * punto donde se traduce entre esas rutas lógicas y las URLs reales del navegador.
 */

/** Directorio real donde vive index.html (con "/" inicial y final). */
export const BASE_PATH = (() => {
  try {
    return new URL('.', document.baseURI).pathname;
  } catch {
    return '/';
  }
})();

/** Convierte una ruta lógica ("/productos") en la URL real del navegador ("/repo/productos"). */
export function withBase(path) {
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return BASE_PATH + clean;
}

/** Convierte un pathname real del navegador en la ruta lógica de la app (inverso de withBase). */
export function stripBase(pathname) {
  if (pathname.startsWith(BASE_PATH)) {
    return '/' + pathname.slice(BASE_PATH.length);
  }
  return pathname;
}
