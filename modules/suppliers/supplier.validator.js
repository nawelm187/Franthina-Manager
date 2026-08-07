/**
 * supplier.validator.js
 * Responsabilidad: centralizar la validación de un Proveedor.
 */

import { ValidationError } from '../../core/errors.js';
import { isNonEmptyString, isValidEmail, isNonNegativeNumber } from '../../core/validators.js';

export function validateSupplier(data) {
  const fieldErrors = {};

  if (!isNonEmptyString(data.name, 2)) {
    fieldErrors.name = 'El nombre debe tener entre 2 y 200 caracteres.';
  }
  if (data.email && !isValidEmail(data.email)) {
    fieldErrors.email = 'El email no parece válido.';
  }
  if (!isNonNegativeNumber(data.leadTimeDays)) {
    fieldErrors.leadTimeDays = 'El tiempo de entrega no puede ser negativo.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
