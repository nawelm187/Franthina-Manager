/**
 * ingredient.validator.js
 * Responsabilidad: centralizar la validación de un Ingrediente.
 */

import { ValidationError } from '../../core/errors.js';
import { isNonEmptyString, isNonNegativeNumber, isOneOf } from '../../core/validators.js';
import { UNITS } from './ingredient.model.js';

export function validateIngredient(data) {
  const fieldErrors = {};

  if (!isNonEmptyString(data.name, 2)) {
    fieldErrors.name = 'El nombre debe tener entre 2 y 200 caracteres.';
  }
  if (!isOneOf(data.unit, UNITS)) {
    fieldErrors.unit = 'Unidad inválida.';
  }
  if (!isNonNegativeNumber(data.stock)) fieldErrors.stock = 'El stock no puede ser negativo.';
  if (!isNonNegativeNumber(data.minStock)) fieldErrors.minStock = 'El stock mínimo no puede ser negativo.';
  if (!isNonNegativeNumber(data.cost)) fieldErrors.cost = 'El costo no puede ser negativo.';

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
