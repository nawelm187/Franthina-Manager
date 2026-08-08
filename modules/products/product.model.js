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
 * @property {number} costPrice     - precio de costo (NUNCA se muestra en la tienda pública)
 * @property {number} sellPrice     - precio sugerido de venta (este sí se muestra en la tienda)
 * @property {number} stock
 * @property {boolean} active       - además de su uso interno, controla si el producto
 *   aparece en la tienda pública (inactivo = oculto para el cliente)
 * @property {string} notes         - notas internas, NUNCA se muestran en la tienda pública
 * @property {string} description   - descripción pública, se muestra en la tienda
 * @property {string} imageUrl      - URL de una foto pública del producto (opcional)
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
    description: '',
    imageUrl: '',
  };
}
