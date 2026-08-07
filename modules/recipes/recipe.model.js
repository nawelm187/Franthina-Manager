/**
 * recipe.model.js
 * Responsabilidad: forma de los datos de una Receta y valores por defecto.
 * Una receta referencia ingredientes por id — nunca duplica sus datos.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const RECIPE_COLLECTION = COLLECTIONS.RECIPES;

/**
 * @typedef {Object} RecipeItem
 * @property {string} ingredientId
 * @property {number} quantity
 * @property {string|null} unit - unidad en la que se cargó la cantidad. Puede
 *   ser distinta a la unidad del ingrediente (ej. ingrediente en "kg",
 *   receta cargada en "g") siempre que sea de la misma dimensión (ver
 *   core/units.js) — el costo y el consumo se convierten automáticamente.
 *   `null` en recetas creadas antes de esta función: se asume la unidad del
 *   ingrediente (comportamiento anterior, retrocompatible).
 */

/**
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} name
 * @property {RecipeItem[]} items
 * @property {number} yieldQuantity   - cuántas unidades produce la receta
 * @property {string} yieldUnit
 * @property {number} prepTimeMinutes
 * @property {string} notes
 * @property {number} version         - se incrementa en cada edición (base para historial futuro)
 */

export function createEmptyRecipe() {
  return {
    name: '',
    items: [],
    yieldQuantity: 1,
    yieldUnit: 'unidad',
    prepTimeMinutes: 0,
    notes: '',
    version: 1,
  };
}

export function createEmptyRecipeItem() {
  return { ingredientId: '', quantity: 0, unit: null };
}
