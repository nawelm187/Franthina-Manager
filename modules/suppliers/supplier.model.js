/**
 * supplier.model.js
 * Responsabilidad: forma de los datos de un Proveedor y valores por defecto.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const SUPPLIER_COLLECTION = COLLECTIONS.SUPPLIERS;

export function createEmptySupplier() {
  return {
    name: '',
    contactName: '',
    phone: '',
    email: '',
    leadTimeDays: 0,
    notes: '',
  };
}
