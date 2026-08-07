/**
 * inventory.validator.js
 * Responsabilidad: centralizar la validación de un Movimiento de inventario.
 */

import { ValidationError } from '../../core/errors.js';
import { isPositiveNumber, isOneOf } from '../../core/validators.js';
import { MOVEMENT_TYPES } from './inventory.model.js';

export function validateMovement(data) {
  const fieldErrors = {};

  if (!data.ingredientId) {
    fieldErrors.ingredientId = 'Seleccioná un ingrediente.';
  }
  if (!isOneOf(data.type, Object.values(MOVEMENT_TYPES))) {
    fieldErrors.type = 'Tipo de movimiento inválido.';
  }
  if (!isPositiveNumber(data.quantity)) {
    fieldErrors.quantity = 'La cantidad debe ser mayor a cero.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
