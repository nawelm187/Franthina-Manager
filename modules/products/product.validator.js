/**
 * product.validator.js
 * Responsabilidad: centralizar toda validación de un Producto.
 * Nunca se valida directamente dentro del formulario del renderer.
 */

import { ValidationError } from '../../core/errors.js';
import { isNonEmptyString, isNonNegativeNumber } from '../../core/validators.js';

/** @param {import('./product.model.js').Product} data @throws {ValidationError} */
export function validateProduct(data) {
  /** @type {Record<string,string>} */
  const fieldErrors = {};

  if (!isNonEmptyString(data.name, 2)) {
    fieldErrors.name = 'El nombre debe tener entre 2 y 200 caracteres.';
  }
  if (!isNonNegativeNumber(data.costPrice)) {
    fieldErrors.costPrice = 'El precio de costo no puede ser negativo.';
  }
  if (!isNonNegativeNumber(data.sellPrice)) {
    fieldErrors.sellPrice = 'El precio de venta no puede ser negativo.';
  }
  if (data.sellPrice > 0 && data.costPrice > data.sellPrice) {
    fieldErrors.sellPrice = 'El precio de venta es menor al costo: revisá la rentabilidad.';
  }
  if (!isNonNegativeNumber(data.stock)) {
    fieldErrors.stock = 'El stock no puede ser negativo.';
  }
  if (data.description && data.description.length > 500) {
    fieldErrors.description = 'La descripción no puede superar los 500 caracteres.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
