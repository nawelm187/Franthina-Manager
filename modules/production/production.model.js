/**
 * production.model.js
 * Responsabilidad: forma de una Orden de producción y sus valores por defecto.
 * Una orden referencia una receta por id — nunca duplica sus datos.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const PRODUCTION_COLLECTION = COLLECTIONS.PRODUCTION_ORDERS;

export const ORDER_STATUS = Object.freeze({
  PLANNED: 'planned',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PLANNED]: 'Planificada',
  [ORDER_STATUS.COMPLETED]: 'Completada',
  [ORDER_STATUS.CANCELLED]: 'Cancelada',
};

/**
 * @typedef {Object} ProductionOrder
 * @property {string} id
 * @property {string} recipeId
 * @property {number} multiplier      - cuántas veces se repite la receta (permite lotes grandes)
 * @property {string} status
 * @property {string} plannedDate     - ISO date, cuándo se planea producir
 * @property {string} notes
 * @property {string|null} completedAt
 */

export function createEmptyProductionOrder() {
  return {
    recipeId: '',
    multiplier: 1,
    status: ORDER_STATUS.PLANNED,
    plannedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    completedAt: null,
  };
}
