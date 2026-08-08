/**
 * eventBus.js
 * Responsabilidad: comunicación desacoplada entre módulos.
 * Los módulos NUNCA se importan entre sí directamente para comunicarse:
 * siempre emiten y escuchan eventos a través de este bus.
 */

class EventBus {
  #listeners = new Map();

  /** @param {string} event @param {(payload:any)=>void} handler @returns {()=>void} función para desuscribirse */
  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.#listeners.get(event)?.delete(handler);
  }

  /** @param {string} event @param {any} [payload] */
  emit(event, payload) {
    this.#listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        // Un listener roto nunca debe romper a los demás.
        console.error(`[EventBus] Error en handler de "${event}"`, err);
      }
    });
  }
}

export const eventBus = new EventBus();

/** Catálogo centralizado de nombres de eventos — nunca usar strings sueltos en los módulos. */
export const EVENTS = Object.freeze({
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  INGREDIENT_CREATED: 'ingredient:created',
  INGREDIENT_UPDATED: 'ingredient:updated',
  INGREDIENT_DELETED: 'ingredient:deleted',
  INGREDIENT_LOW_STOCK: 'ingredient:low-stock',
  RECIPE_CREATED: 'recipe:created',
  RECIPE_UPDATED: 'recipe:updated',
  RECIPE_DELETED: 'recipe:deleted',
  INVENTORY_MOVEMENT_CREATED: 'inventory:movement-created',
  PRODUCTION_ORDER_CREATED: 'production:order-created',
  PRODUCTION_ORDER_COMPLETED: 'production:order-completed',
  PRODUCTION_ORDER_CANCELLED: 'production:order-cancelled',
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',
  CUSTOMER_DELETED: 'customer:deleted',
  CASHBOX_OPENED: 'cashbox:opened',
  CASHBOX_CLOSED: 'cashbox:closed',
  CASHBOX_MOVEMENT_CREATED: 'cashbox:movement-created',
  SALE_CREATED: 'sale:created',
  ORDER_CREATED: 'order:created',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',
  SUPPLIER_CREATED: 'supplier:created',
  SUPPLIER_UPDATED: 'supplier:updated',
  SUPPLIER_DELETED: 'supplier:deleted',
  PURCHASE_CREATED: 'purchase:created',
  ROUTE_CHANGED: 'route:changed',
  TOAST_SHOW: 'toast:show',
  A11Y_PREFS_CHANGED: 'a11y:changed',
  CART_CHANGED: 'cart:changed',
  BACKUP_EXPORTED: 'backup:exported',
  BACKUP_RESTORED: 'backup:restored',
});
