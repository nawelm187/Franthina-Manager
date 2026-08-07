/**
 * product.model.js
 * Responsabilidad: definir la forma de un Producto y sus valores por defecto.
 * Nunca renderiza, nunca accede a almacenamiento, nunca contiene lógica de negocio.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const PRODUCT_COLLECTION = COLLECTIONS.PRODUCTS;

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string|null} recipeId - receta opcional que define este producto; si está
 *   seteada, el costo puede sincronizarse con el costo calculado de la receta
 * @property {number} costPrice     - precio de costo
 * @property {number} sellPrice     - precio sugerido de venta
 * @property {number} stock
 * @property {boolean} active
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {Omit<Product, 'id'|'createdAt'|'updatedAt'>} */
export function createEmptyProduct() {
  return {
    name: '',
    category: 'General',
    recipeId: null,
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    active: true,
    notes: '',
  };
}
