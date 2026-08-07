/**
 * purchase.model.js
 * Responsabilidad: forma de una Compra y sus valores por defecto.
 * Una compra referencia un proveedor e ingredientes por id — nunca duplica
 * sus datos.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const PURCHASE_COLLECTION = COLLECTIONS.PURCHASES;

/**
 * @typedef {Object} PurchaseItem
 * @property {string} ingredientId
 * @property {number} quantity
 * @property {number} unitCost - costo pagado en ESTA compra, puede diferir del costo actual del ingrediente
 */

/**
 * @typedef {Object} Purchase
 * @property {string} id
 * @property {string} supplierId
 * @property {PurchaseItem[]} items
 * @property {string} notes
 */

export function createEmptyPurchase() {
  return { supplierId: '', items: [], notes: '' };
}

/** Calcula el costo total de una compra a partir de sus líneas. Función pura. */
export function calculatePurchaseTotal(purchase) {
  return purchase.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
}
