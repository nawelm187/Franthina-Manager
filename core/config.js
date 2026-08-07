/**
 * config.js
 * Responsabilidad: única fuente de configuración global de la aplicación.
 * Nunca duplicar constantes fuera de este archivo.
 */

export const APP_CONFIG = Object.freeze({
  appName: 'Franthina Manager',
  version: '0.18.0-mvp',
  storageAdapter: 'localStorage', // 'localStorage' | 'indexedDB' | futuros: 'supabase' | 'rest'
  storagePrefix: 'franthina:',
  defaultCurrency: 'ARS',
  defaultLocale: 'es-AR',
});

export const ROUTES = Object.freeze({
  DASHBOARD: '/',
  PRODUCTS: '/productos',
  PRODUCT_DETAIL: '/productos/:id',
  INGREDIENTS: '/ingredientes',
  INGREDIENT_DETAIL: '/ingredientes/:id',
  RECIPES: '/recetas',
  INVENTORY: '/inventario',
  PRODUCTION: '/produccion',
  CUSTOMERS: '/clientes',
  SALES: '/ventas',
  CASHBOX: '/caja',
  ORDERS: '/pedidos',
  SUPPLIERS: '/proveedores',
  PURCHASES: '/compras',
  REPORTS: '/reportes',
  SETTINGS: '/configuracion',
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


