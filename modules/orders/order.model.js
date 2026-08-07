/**
 * order.model.js
 * Responsabilidad: forma de un Pedido y sus valores por defecto.
 * A diferencia de una Venta (pago y entrega inmediatos), un Pedido admite
 * seña, saldo pendiente y una fecha de entrega futura.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const ORDER_COLLECTION = COLLECTIONS.ORDERS;

export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.DELIVERED]: 'Entregado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
};

/**
 * @typedef {Object} OrderItem
 * @property {string} productId
 * @property {number} quantity
 * @property {number} unitPrice
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} customerId    - a diferencia de Ventas, el cliente es obligatorio
 * @property {OrderItem[]} items
 * @property {string} deliveryDate  - ISO date
 * @property {number} depositAmount - seña cobrada al crear el pedido
 * @property {string} status
 * @property {string} notes
 * @property {string|null} deliveredAt
 * @property {string|null} productionOrderId - vínculo opcional a una orden de producción
 */

export function createEmptyOrder() {
  return {
    customerId: '',
    items: [],
    deliveryDate: new Date().toISOString().slice(0, 10),
    depositAmount: 0,
    status: ORDER_STATUS.PENDING,
    notes: '',
    deliveredAt: null,
    productionOrderId: null,
  };
}

/** Calcula el total de un pedido a partir de sus líneas. Función pura. */
export function calculateOrderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/** Saldo pendiente de cobro = total - seña ya cobrada. Función pura. */
export function calculateOrderBalance(order) {
  return Math.max(0, calculateOrderTotal(order) - (Number(order.depositAmount) || 0));
}
