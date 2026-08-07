/**
 * recipe.validator.js
 * Responsabilidad: centralizar la validación de una Receta.
 */

import { ValidationError } from '../../core/errors.js';
import { isNonEmptyString, isPositiveNumber } from '../../core/validators.js';

/** @param {import('./recipe.model.js').Recipe} data */
export function validateRecipe(data) {
  const fieldErrors = {};

  if (!isNonEmptyString(data.name, 2)) {
    fieldErrors.name = 'El nombre debe tener entre 2 y 200 caracteres.';
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    fieldErrors.items = 'Agregá al menos un ingrediente a la receta.';
  } else if (data.items.some((it) => !it.ingredientId || !isPositiveNumber(it.quantity))) {
    fieldErrors.items = 'Cada ingrediente necesita cantidad mayor a cero.';
  } else {
    const ids = data.items.map((it) => it.ingredientId);
    if (new Set(ids).size !== ids.length) {
      fieldErrors.items = 'Hay un ingrediente repetido en la receta — sumá su cantidad en una sola línea en vez de agregarlo dos veces.';
    }
  }
  if (!isPositiveNumber(data.yieldQuantity)) {
    fieldErrors.yieldQuantity = 'El rendimiento debe ser mayor a cero.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
