/**
 * sale.validator.js
 * Responsabilidad: centralizar la validación de una Venta.
 */

import { ValidationError } from '../../core/errors.js';
import { isPositiveNumber, isNonNegativeNumber, isOneOf } from '../../core/validators.js';
import { PAYMENT_METHODS, calculateSaleTotal } from './sale.model.js';

export function validateSale(data) {
  const fieldErrors = {};

  if (!Array.isArray(data.items) || data.items.length === 0) {
    fieldErrors.items = 'Agregá al menos un producto a la venta.';
  } else if (data.items.some((it) => !it.productId || !isPositiveNumber(it.quantity))) {
    fieldErrors.items = 'Cada línea necesita un producto y una cantidad mayor a cero.';
  }
  if (!isOneOf(data.paymentMethod, Object.values(PAYMENT_METHODS))) {
    fieldErrors.paymentMethod = 'Seleccioná un método de pago.';
  }
  if (!isNonNegativeNumber(data.discount)) {
    fieldErrors.discount = 'El descuento no puede ser negativo.';
  }
  if (data.amountReceived !== null && data.amountReceived !== undefined) {
    if (!isNonNegativeNumber(data.amountReceived)) {
      fieldErrors.amountReceived = 'El monto recibido no puede ser negativo.';
    } else if (Array.isArray(data.items) && data.items.length > 0 && Number(data.amountReceived) < calculateSaleTotal(data)) {
      fieldErrors.amountReceived = 'El monto recibido es menor al total de la venta.';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('Revisá los campos marcados en el formulario.', fieldErrors);
  }
}
