/**
 * app.js
 * Responsabilidad: único punto de arranque de la aplicación.
 *
 * Desde v0.19 la app tiene dos "zonas" que comparten un único Router y un
 * único nodo <main id="main-content"> (nunca se recrea — así el Router se
 * construye una sola vez, para toda la vida de la página, y no acumula
 * listeners de popstate ni pierde referencias al cruzar entre zonas):
 *
 * - Tienda pública (ROUTES.STORE_HOME, ROUTES.STORE_CART): la ve cualquier
 *   visitante, sin login. Chrome: header + footer de tienda.
 * - Administración (todo bajo /admin): el sistema de gestión existente,
 *   intacto. Chrome: sidebar + botón ☰ en mobile.
 *
 * Cuando la ruta activa cambia de zona, se reconstruye el "chrome" (la
 * cáscara visual alrededor del contenido) y se reubica el mismo nodo
 * <main> adentro — nunca contiene lógica de negocio de ningún módulo.
 */

import { ROUTES, NAV_ITEMS, APP_CONFIG } from './core/config.js';
import { Router } from './core/router.js';
import { withBase, stripBase } from './core/basePath.js';
import { store } from './core/state.js';
import { eventBus, EVENTS } from './core/eventBus.js';
import { installGlobalErrorHandling } from './core/errors.js';
import { runMigrations } from './core/storage/migrations.js';
import { initToastListener } from './components/toast.js';
import { storeCart } from './core/storeCart.js';

installGlobalErrorHandling();

const STORE_NAV_ITEMS = [
  { route: ROUTES.STORE_HOME, label: 'Inicio', icon: '🏠' },
];

/** @type {HTMLElement} nodo estable, nunca se recrea — ver comentario de arriba */
let mainContentEl;
let currentZone = null;

function zoneOf(pathname) {
  return pathname.startsWith('/admin') ? 'admin' : 'store';
}

function slotMainContent(container) {
  const slot = container.querySelector('#main-content-slot');
  slot.replaceWith(mainContentEl);
}

function buildAdminChrome() {
  document.body.innerHTML = `
    <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
    <div class="app-shell">
      <button class="btn btn--ghost sidebar-toggle" id="sidebar-toggle" aria-label="Abrir menú" aria-expanded="false">☰</button>
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <nav class="app-sidebar" id="app-sidebar" aria-label="Navegación principal">
        <a class="app-brand" href="${withBase(ROUTES.DASHBOARD)}" data-link aria-label="Ir al panel principal">
          <img src="assets/icons/logo-sidebar.png" alt="" class="app-brand__logo" width="40" height="40" />
          ${APP_CONFIG.appName}
        </a>
        ${NAV_ITEMS.map((item) => `
          <a class="nav-link" href="${withBase(item.route)}" data-link data-route="${item.route}">
            <span class="nav-link__icon" aria-hidden="true">${item.icon}</span> ${item.label}
          </a>`).join('')}
        <a class="nav-link nav-link--muted" href="${withBase(ROUTES.STORE_HOME)}" data-link data-route="${ROUTES.STORE_HOME}">
          <span class="nav-link__icon" aria-hidden="true">🛍️</span> Ver tienda online
        </a>
      </nav>
      <div id="main-content-slot"></div>
    </div>
  `;
  slotMainContent(document.querySelector('.app-shell'));
  mainContentEl.className = 'app-main';
  setupSidebarToggle();
}

function buildStoreChrome() {
  document.body.innerHTML = `
    <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
    <div class="store-shell">
      <header class="store-header">
        <a class="store-brand" href="${withBase(ROUTES.STORE_HOME)}" data-link aria-label="Ir al inicio de la tienda">
          <img src="assets/icons/logo-sidebar.png" alt="" class="store-brand__logo" width="36" height="36" />
          ${APP_CONFIG.appName}
        </a>
        <nav class="store-nav" aria-label="Navegación de la tienda">
          ${STORE_NAV_ITEMS.map((item) => `
            <a class="nav-link" href="${withBase(item.route)}" data-link data-route="${item.route}">${item.label}</a>`).join('')}
          <a class="nav-link store-cart-link" href="${withBase(ROUTES.STORE_CART)}" data-link data-route="${ROUTES.STORE_CART}" aria-label="Ver carrito">
            🛒 Carrito<span class="cart-badge" id="cart-badge" hidden>0</span>
          </a>
        </nav>
      </header>
      <div id="main-content-slot"></div>
      <footer class="store-footer">
        <p>${APP_CONFIG.appName} — pedidos sujetos a disponibilidad y confirmación.</p>
        <a href="${withBase(ROUTES.DASHBOARD)}" data-link class="store-admin-link">Panel de administración</a>
      </footer>
    </div>
  `;
  slotMainContent(document.querySelector('.store-shell'));
  mainContentEl.className = 'app-main';
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = storeCart.getCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function applyA11yPrefs(a11y) {
  const html = document.documentElement;
  html.classList.toggle('a11y-text-lg', a11y.textSize === 'lg');
  html.classList.toggle('a11y-text-xl', a11y.textSize === 'xl');
  html.classList.toggle('a11y-contrast-high', a11y.contrast === 'high');
  html.classList.toggle('a11y-spacing-relaxed', a11y.spacing === 'relaxed');
  html.classList.toggle('a11y-reduce-motion', Boolean(a11y.reduceMotion));
  html.classList.toggle('theme-dark', a11y.theme === 'dark');
}

function highlightActiveNav(pathname) {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.route === pathname);
  });
}

/**
 * Se ejecuta en cada cambio de ruta (lo emite el Router). Si la nueva ruta
 * cae en una zona distinta a la actual (tienda ↔ admin), reconstruye el
 * chrome antes de que el módulo renderice — así, para cuando `view.render()`
 * corre, `mainContentEl` ya está reubicado en la posición correcta del DOM.
 */
function onRouteChanged(pathname) {
  const zone = zoneOf(pathname);
  if (zone !== currentZone) {
    currentZone = zone;
    if (zone === 'admin') buildAdminChrome(); else buildStoreChrome();
  }
  highlightActiveNav(pathname);
}

function interceptInternalLinks(router) {
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (!link) return;
    e.preventDefault();
    router.navigate(link.getAttribute('href'));
    closeSidebar();
  });
}

function closeSidebar() {
  document.getElementById('app-sidebar')?.classList.remove('is-open');
  document.getElementById('sidebar-backdrop')?.classList.remove('is-open');
  const toggle = document.getElementById('sidebar-toggle');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.classList.remove('is-hidden');
  document.removeEventListener('keydown', onSidebarKeydown);
}

/**
 * Mientras el menú mobile está abierto: Escape lo cierra y devuelve el foco
 * al botón ☰; Tab queda atrapado dentro del menú (igual que en los modales,
 * ver components/modal.js) para que no se escape hacia contenido oculto
 * detrás del fondo oscuro.
 */
function onSidebarKeydown(e) {
  const sidebar = document.getElementById('app-sidebar');
  if (e.key === 'Escape') {
    closeSidebar();
    document.getElementById('sidebar-toggle')?.focus();
    return;
  }
  if (e.key !== 'Tab' || !sidebar) return;
  const focusable = Array.from(sidebar.querySelectorAll('a[href]')).filter((el) => el.offsetParent !== null);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function setupSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  toggle?.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('is-open');
    backdrop.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    // El botón se esconde mientras el menú está abierto para no tapar el logo;
    // el menú se puede cerrar tocando afuera (backdrop), con Escape, o eligiendo una sección.
    toggle.classList.toggle('is-hidden', isOpen);
    if (isOpen) {
      document.addEventListener('keydown', onSidebarKeydown);
      sidebar.querySelector('a')?.focus();
    } else {
      document.removeEventListener('keydown', onSidebarKeydown);
    }
  });
  backdrop?.addEventListener('click', () => {
    closeSidebar();
    toggle?.focus();
  });
}

async function init() {
  await store.hydrateA11yPrefs();

  // mainContentEl se crea UNA sola vez acá; buildAdminChrome/buildStoreChrome
  // solo lo reubican (nunca lo recrean) cada vez que cambia la zona.
  mainContentEl = document.createElement('main');
  mainContentEl.id = 'main-content';
  mainContentEl.tabIndex = -1;

  initToastListener();
  applyA11yPrefs(store.getState().a11y);
  eventBus.on(EVENTS.A11Y_PREFS_CHANGED, applyA11yPrefs);
  eventBus.on(EVENTS.CART_CHANGED, updateCartBadge);

  // Las migraciones corren antes que cualquier módulo toque datos.
  await runMigrations();

  const router = new Router(mainContentEl);

  router
    // Tienda pública
    .register(ROUTES.STORE_HOME, () => import('./modules/store-catalog/index.js'))
    .register(ROUTES.STORE_CART, () => import('./modules/store-cart/index.js'))
    // Administración
    .register(ROUTES.DASHBOARD, () => import('./modules/dashboard/index.js'))
    .register(ROUTES.PRODUCTS, () => import('./modules/products/index.js'))
    .register(ROUTES.INGREDIENTS, () => import('./modules/ingredients/index.js'))
    .register(ROUTES.RECIPES, () => import('./modules/recipes/index.js'))
    .register(ROUTES.INVENTORY, () => import('./modules/inventory/index.js'))
    .register(ROUTES.PRODUCTION, () => import('./modules/production/index.js'))
    .register(ROUTES.CUSTOMERS, () => import('./modules/customers/index.js'))
    .register(ROUTES.SALES, () => import('./modules/sales/index.js'))
    .register(ROUTES.CASHBOX, () => import('./modules/cashbox/index.js'))
    .register(ROUTES.ORDERS, () => import('./modules/orders/index.js'))
    .register(ROUTES.SUPPLIERS, () => import('./modules/suppliers/index.js'))
    .register(ROUTES.PURCHASES, () => import('./modules/purchases/index.js'))
    .register(ROUTES.REPORTS, () => import('./modules/reports/index.js'))
    .register(ROUTES.SETTINGS, () => import('./modules/settings/index.js'))
    .registerNotFound(() => import('./modules/not-found/index.js'));

  eventBus.on(EVENTS.ROUTE_CHANGED, onRouteChanged);

  // Construye el chrome inicial ANTES de router.start(), para que el primer
  // render tenga dónde ubicarse (onRouteChanged también lo haría, pero recién
  // después de que la primera navegación resuelva la ruta).
  currentZone = zoneOf(stripBase(window.location.pathname || '/') || '/');
  if (currentZone === 'admin') buildAdminChrome(); else buildStoreChrome();

  interceptInternalLinks(router);
  router.start();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        // El funcionamiento offline es una mejora progresiva: si falla, la app sigue funcionando online.
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
