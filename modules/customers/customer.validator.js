/**
 * customer.validator.js
 * Responsabilidad: centralizar la validación de un Cliente.
 */

import { ValidationError } from '../../core/errors.js';
import { isNonEmptyString, isValidEmail } from '../../core/validators.js';

export function validateCustomer(data) {
  const fieldErrors = {};

  if (!isNonEmptyString(data.name, 2)) {
    fieldErrors.name = 'El nombre debe tener entre 2 y 200 caracteres.';
  }
  if (data.email && !isValidEmail(data.email)) {
    fieldErrors.email = 'El email no parece válido.';
  }
  if (!data.phone && !data.email) {
    fieldErrors.phone = 'Cargá al menos un teléfono o un email de contacto.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
