/**
 * cashbox.validator.js
 * Responsabilidad: centralizar la validación de aperturas, cierres y movimientos de caja.
 */

import { ValidationError } from '../../core/errors.js';
import { isNonEmptyString, isPositiveNumber, isNonNegativeNumber, isOneOf } from '../../core/validators.js';
import { MOVEMENT_TYPES } from './cashbox.model.js';

export function validateOpening(data) {
  const fieldErrors = {};
  if (!isNonNegativeNumber(data.openingAmount)) fieldErrors.openingAmount = 'El monto de apertura no puede ser negativo.';
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}

export function validateClosing(data) {
  const fieldErrors = {};
  if (!isNonNegativeNumber(data.closingAmountCounted)) {
    fieldErrors.closingAmountCounted = 'Contá el efectivo en caja e ingresá el monto.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}

export function validateMovement(data) {
  const fieldErrors = {};
  if (!isOneOf(data.type, Object.values(MOVEMENT_TYPES))) fieldErrors.type = 'Tipo de movimiento inválido.';
  if (!isPositiveNumber(data.amount)) fieldErrors.amount = 'El monto debe ser mayor a cero.';
  if (!isNonEmptyString(data.reason, 2)) fieldErrors.reason = 'Indicá un motivo.';
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
