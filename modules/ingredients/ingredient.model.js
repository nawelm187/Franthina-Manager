/**
 * ingredient.model.js
 * Responsabilidad: forma de los datos de un Ingrediente y valores por defecto.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const INGREDIENT_COLLECTION = COLLECTIONS.INGREDIENTS;
export const UNITS = ['g', 'kg', 'ml', 'l', 'unidad'];

export function createEmptyIngredient() {
  return {
    name: '',
    unit: 'g',
    stock: 0,
    minStock: 0,
    cost: 0,
    supplier: '',
    notes: '',
  };
}
