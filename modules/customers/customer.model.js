/**
 * customer.model.js
 * Responsabilidad: forma de los datos de un Cliente y valores por defecto.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const CUSTOMER_COLLECTION = COLLECTIONS.CUSTOMERS;

export function createEmptyCustomer() {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    birthday: '',
    notes: '',
  };
}
