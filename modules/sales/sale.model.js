/**
 * sale.model.js
 * Responsabilidad: forma de una Venta y sus valores por defecto.
 * Una venta referencia productos y (opcionalmente) un cliente por id —
 * nunca duplica sus datos.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const SALE_COLLECTION = COLLECTIONS.SALES;

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
});

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Efectivo',
  [PAYMENT_METHODS.CARD]: 'Tarjeta',
  [PAYMENT_METHODS.TRANSFER]: 'Transferencia',
};

/**
 * @typedef {Object} SaleItem
 * @property {string} productId
 * @property {number} quantity
 * @property {number} unitPrice  - precio al momento de la venta (nunca referencia el precio actual del producto)
 */

/**
 * @typedef {Object} Sale
 * @property {string} id
 * @property {string|null} customerId
 * @property {SaleItem[]} items
 * @property {string} paymentMethod
 * @property {number} discount        - descuento total en moneda. No se expone en el
 *   formulario de carga (se guarda en 0) — queda en el modelo por si se
 *   reactiva más adelante (promociones, combos), sin tener que rediseñar
 *   el cálculo del total.
 * @property {number|null} amountReceived - efectivo recibido del cliente, solo
 *   tiene sentido para pagos en efectivo. Null si no se cargó (venta con
 *   monto exacto, o pago que no es en efectivo).
 * @property {string} notes
 */

export function createEmptySale() {
  return {
    customerId: null,
    items: [],
    paymentMethod: PAYMENT_METHODS.CASH,
    discount: 0,
    amountReceived: null,
    notes: '',
  };
}

export function createEmptySaleItem() {
  return { productId: '', quantity: 1, unitPrice: 0 };
}

/** Calcula el total de una venta a partir de sus líneas y el descuento. Función pura. */
export function calculateSaleTotal(sale) {
  const subtotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return Math.max(0, subtotal - (Number(sale.discount) || 0));
}

/**
 * Vuelto a entregar = lo recibido menos el total. Función pura.
 * Devuelve `null` si no se cargó un monto recibido (no aplica).
 * Puede devolver un número negativo si lo recibido no alcanza — la UI
 * decide cómo mostrar ese caso (ver sale.renderer.js).
 */
export function calculateChange(sale) {
  if (sale.amountReceived === null || sale.amountReceived === undefined || sale.amountReceived === '') return null;
  return Number(sale.amountReceived) - calculateSaleTotal(sale);
}
