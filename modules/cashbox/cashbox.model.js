/**
 * cashbox.model.js
 * Responsabilidad: forma de una Sesión de caja y de un Movimiento de caja.
 * Solo puede existir una sesión abierta a la vez (se valida en el Service).
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const CASHBOX_SESSION_COLLECTION = COLLECTIONS.CASHBOX_SESSIONS;
export const CASHBOX_MOVEMENT_COLLECTION = COLLECTIONS.CASHBOX_MOVEMENTS;

export const SESSION_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

export const MOVEMENT_TYPES = Object.freeze({
  INCOME: 'income',   // ingreso manual (no ligado a una venta)
  EXPENSE: 'expense',
  SALE: 'sale',        // generado automáticamente por el módulo Ventas
});

export const MOVEMENT_TYPE_LABELS = {
  [MOVEMENT_TYPES.INCOME]: 'Ingreso',
  [MOVEMENT_TYPES.EXPENSE]: 'Egreso',
  [MOVEMENT_TYPES.SALE]: 'Venta',
};

/**
 * @typedef {Object} CashboxSession
 * @property {string} id
 * @property {string} status
 * @property {number} openingAmount
 * @property {number|null} closingAmountCounted  - lo que se contó físicamente al cerrar
 * @property {number|null} expectedAmount         - lo que debería haber según los movimientos
 * @property {number|null} difference              - contado - esperado (positivo o negativo)
 * @property {string|null} closedAt
 * @property {string} notes
 */

export function createEmptySession(openingAmount = 0) {
  return {
    status: SESSION_STATUS.OPEN,
    openingAmount,
    closingAmountCounted: null,
    expectedAmount: null,
    difference: null,
    closedAt: null,
    notes: '',
  };
}

export function createEmptyMovement() {
  return { sessionId: '', type: MOVEMENT_TYPES.INCOME, amount: 0, reason: '' };
}
