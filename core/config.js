/**
 * config.js
 * Responsabilidad: única fuente de configuración global de la aplicación.
 * Nunca duplicar constantes fuera de este archivo.
 */

export const APP_CONFIG = Object.freeze({
  appName: 'Franthina Manager',
  version: '0.19.0',
  storageAdapter: 'localStorage', // 'localStorage' | 'indexedDB' | futuros: 'supabase' | 'rest'
  storagePrefix: 'franthina:',
  defaultCurrency: 'ARS',
  defaultLocale: 'es-AR',
});

export const ROUTES = Object.freeze({
  // Tienda pública — la ve cualquier visitante, sin login.
  STORE_HOME: '/',
  STORE_CART: '/carrito',

  // Administración — todo el sistema de gestión actual, ahora detrás de
  // /admin. v0.19 es solo esta separación de rutas: la protección real con
  // login llega en una versión futura (ver docs/ROADMAP si existe, o el
  // historial de la conversación) — por ahora /admin es una URL más, no un
  // área con acceso restringido de verdad.
  DASHBOARD: '/admin',
  PRODUCTS: '/admin/productos',
  PRODUCT_DETAIL: '/admin/productos/:id',
  INGREDIENTS: '/admin/ingredientes',
  INGREDIENT_DETAIL: '/admin/ingredientes/:id',
  RECIPES: '/admin/recetas',
  INVENTORY: '/admin/inventario',
  PRODUCTION: '/admin/produccion',
  CUSTOMERS: '/admin/clientes',
  SALES: '/admin/ventas',
  CASHBOX: '/admin/caja',
  ORDERS: '/admin/pedidos',
  SUPPLIERS: '/admin/proveedores',
  PURCHASES: '/admin/compras',
  REPORTS: '/admin/reportes',
  SETTINGS: '/admin/configuracion',
});

export const NAV_ITEMS = Object.freeze([
  { route: ROUTES.DASHBOARD, label: 'Panel principal', icon: '🏠' },
  { route: ROUTES.SALES, label: 'Ventas', icon: '🛒' },
  { route: ROUTES.ORDERS, label: 'Pedidos', icon: '📝' },
  { route: ROUTES.CASHBOX, label: 'Caja', icon: '💰' },
  { route: ROUTES.PRODUCTS, label: 'Productos', icon: '🧁' },
  { route: ROUTES.INGREDIENTS, label: 'Ingredientes', icon: '🌾' },
  { route: ROUTES.RECIPES, label: 'Recetas', icon: '📖' },
  { route: ROUTES.PRODUCTION, label: 'Producción', icon: '🏭' },
  { route: ROUTES.INVENTORY, label: 'Inventario', icon: '📦' },
  { route: ROUTES.PURCHASES, label: 'Compras', icon: '🧾' },
  { route: ROUTES.SUPPLIERS, label: 'Proveedores', icon: '🚚' },
  { route: ROUTES.CUSTOMERS, label: 'Clientes', icon: '👥' },
  { route: ROUTES.REPORTS, label: 'Reportes', icon: '📊' },
  { route: ROUTES.SETTINGS, label: 'Configuración', icon: '⚙️' },
]);


