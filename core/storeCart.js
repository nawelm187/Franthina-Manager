/**
 * storeCart.js
 * Responsabilidad: estado del carrito de compras de la tienda pública.
 *
 * A diferencia de las colecciones del admin (Productos, Pedidos, etc.), el
 * carrito no es un registro auditable con id/createdAt — es un dato de
 * sesión del visitante, así que vive en su propia clave de localStorage en
 * vez de pasar por core/storage/ (StorageAdapter). Se guarda solo
 * {productId, quantity}: el precio y nombre se resuelven siempre al vuelo
 * contra productService, para que el carrito nunca muestre un precio viejo
 * si el producto cambió desde que se agregó.
 */

import { APP_CONFIG } from './config.js';
import { eventBus, EVENTS } from './eventBus.js';

const STORAGE_KEY = `${APP_CONFIG.storagePrefix}cart`;

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // El carrito es una mejora de conveniencia, no un dato crítico — si el
    // navegador no puede guardar (incógnito, sin espacio), seguimos en
    // memoria para esta sesión en vez de romper la compra.
  }
  eventBus.emit(EVENTS.CART_CHANGED, items);
}

export const storeCart = {
  /** @returns {{productId: string, quantity: number}[]} */
  getItems() {
    return read();
  },

  addItem(productId, quantity = 1) {
    const items = read();
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }
    write(items);
  },

  setQuantity(productId, quantity) {
    const items = read();
    const existing = items.find((i) => i.productId === productId);
    if (!existing) return;
    if (quantity <= 0) {
      write(items.filter((i) => i.productId !== productId));
      return;
    }
    existing.quantity = quantity;
    write(items);
  },

  removeItem(productId) {
    write(read().filter((i) => i.productId !== productId));
  },

  clear() {
    write([]);
  },

  getCount() {
    return read().reduce((sum, i) => sum + i.quantity, 0);
  },
};
