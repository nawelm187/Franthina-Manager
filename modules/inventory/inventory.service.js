/**
 * inventory.service.js
 * Responsabilidad: lógica de negocio de movimientos de inventario.
 * Es el único módulo, además del propio Ingredientes, autorizado a modificar
 * el stock de un ingrediente — y lo hace exclusivamente a través del Service
 * público de Ingredientes (`ingredientService.update`), nunca tocando storage
 * directamente. Ver docs/module-inventory.md para la decisión de diseño.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { NotFoundError, InsufficientStockError } from '../../core/errors.js';
import { MOVEMENT_COLLECTION, MOVEMENT_TYPES } from './inventory.model.js';
import { validateMovement } from './inventory.validator.js';
import { ingredientService } from '../ingredients/ingredient.service.js';

/** Signo que aplica cada tipo de movimiento sobre el stock. */
const STOCK_DELTA_SIGN = {
  [MOVEMENT_TYPES.IN]: +1,
  [MOVEMENT_TYPES.OUT]: -1,
  [MOVEMENT_TYPES.WASTE]: -1,
  [MOVEMENT_TYPES.ADJUST]: 0, // el ajuste fija el stock exacto, no suma/resta
};

export const inventoryService = {
  async list() {
    const movements = await storage.getAll(MOVEMENT_COLLECTION);
    return movements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async listForIngredient(ingredientId) {
    const all = await this.list();
    return all.filter((m) => m.ingredientId === ingredientId);
  },

  /**
   * Registra un movimiento y actualiza el stock del ingrediente afectado.
   * @param {{ingredientId:string, type:string, quantity:number, reason:string}} data
   */
  async create(data) {
    validateMovement(data);

    const ingredient = await ingredientService.get(data.ingredientId);
    if (!ingredient) throw new NotFoundError('El ingrediente seleccionado no existe.');

    const isOutflow = data.type === MOVEMENT_TYPES.OUT || data.type === MOVEMENT_TYPES.WASTE;
    if (isOutflow && Number(data.quantity) > ingredient.stock) {
      throw new InsufficientStockError([{
        name: ingredient.name,
        required: Number(data.quantity),
        available: ingredient.stock,
        unit: ingredient.unit,
      }]);
    }

    const newStock = data.type === MOVEMENT_TYPES.ADJUST
      ? Number(data.quantity)
      : Math.max(0, ingredient.stock + STOCK_DELTA_SIGN[data.type] * Number(data.quantity));

    await ingredientService.update(ingredient.id, { ...ingredient, stock: newStock });

    const movement = await storage.create(MOVEMENT_COLLECTION, data);
    eventBus.emit(EVENTS.INVENTORY_MOVEMENT_CREATED, movement);
    return movement;
  },
};
