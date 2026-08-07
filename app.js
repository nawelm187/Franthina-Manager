/**
 * app.js
 * Responsabilidad: único punto de arranque de la aplicación.
 * Construye el shell (sidebar + outlet), registra las rutas con carga perezosa,
 * aplica las preferencias de accesibilidad guardadas, e inicia el router.
 * Nunca contiene lógica de negocio de ningún módulo.
 */

import { ROUTES, NAV_ITEMS, APP_CONFIG } from './core/config.js';
import { Router } from './core/router.js';
import { withBase } from './core/basePath.js';
import { store } from './core/state.js';
import { eventBus, EVENTS } from './core/eventBus.js';
import { installGlobalErrorHandling } from './core/errors.js';
import { runMigrations } from './core/storage/migrations.js';
import { initToastListener } from './components/toast.js';

installGlobalErrorHandling();

function buildShell() {
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
      </nav>
      <main class="app-main" id="main-content" tabindex="-1"></main>
    </div>
  `;
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
  document.getElementById('sidebar-toggle')?.setAttribute('aria-expanded', 'false');
}

function setupSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  toggle?.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('is-open');
    backdrop.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  backdrop?.addEventListener('click', closeSidebar);
}

async function init() {
  await store.hydrateA11yPrefs();
  buildShell();
  initToastListener();
  applyA11yPrefs(store.getState().a11y);
  eventBus.on(EVENTS.A11Y_PREFS_CHANGED, applyA11yPrefs);

  // Las migraciones corren antes que cualquier módulo toque datos.
  await runMigrations();

  const outlet = document.getElementById('main-content');
  const router = new Router(outlet);

  router
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

  eventBus.on(EVENTS.ROUTE_CHANGED, highlightActiveNav);

  interceptInternalLinks(router);
  setupSidebarToggle();
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
