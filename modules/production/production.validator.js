/**
 * production.validator.js
 * Responsabilidad: centralizar la validación de una Orden de producción.
 */

import { ValidationError } from '../../core/errors.js';
import { isPositiveNumber, isValidDateString } from '../../core/validators.js';

export function validateProductionOrder(data) {
  const fieldErrors = {};

  if (!data.recipeId) {
    fieldErrors.recipeId = 'Seleccioná una receta.';
  }
  if (!isPositiveNumber(data.multiplier)) {
    fieldErrors.multiplier = 'La cantidad de lotes debe ser mayor a cero.';
  }
  if (!isValidDateString(data.plannedDate)) {
    fieldErrors.plannedDate = 'Indicá una fecha planificada.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
