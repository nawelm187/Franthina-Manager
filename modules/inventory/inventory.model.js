/**
 * inventory.model.js
 * Responsabilidad: forma de un Movimiento de inventario y sus valores por defecto.
 * Un movimiento es siempre inmutable una vez creado (nunca se edita, solo se crea) —
 * así el historial es confiable para una futura auditoría.
 */

import { COLLECTIONS } from '../../core/constants/storageKeys.js';

export const MOVEMENT_COLLECTION = COLLECTIONS.INVENTORY_MOVEMENTS;

export const MOVEMENT_TYPES = Object.freeze({
  IN: 'in',
  OUT: 'out',
  ADJUST: 'adjust',
  WASTE: 'waste',
});

export const MOVEMENT_TYPE_LABELS = {
  [MOVEMENT_TYPES.IN]: 'Entrada',
  [MOVEMENT_TYPES.OUT]: 'Salida',
  [MOVEMENT_TYPES.ADJUST]: 'Ajuste',
  [MOVEMENT_TYPES.WASTE]: 'Merma',
};

export function createEmptyMovement() {
  return {
    ingredientId: '',
    type: MOVEMENT_TYPES.IN,
    quantity: 0,
    reason: '',
  };
}
