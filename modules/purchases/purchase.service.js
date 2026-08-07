/**
 * purchase.service.js
 * Responsabilidad: lógica de negocio de Compras. Cada línea de compra genera
 * un movimiento de entrada en Inventario (vía su Service público, nunca
 * tocando storage de Ingredientes directamente) y actualiza el costo del
 * ingrediente al último precio pagado — así Inventario, Ingredientes y
 * Recetas (que leen el costo del ingrediente para calcular su propio costo)
 * quedan conectados automáticamente sin que Compras conozca a Recetas.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { NotFoundError } from '../../core/errors.js';
import { runAtomic } from '../../core/storage/atomicRun.js';
import { PURCHASE_COLLECTION } from './purchase.model.js';
import { validatePurchase } from './purchase.validator.js';
import { ingredientService } from '../ingredients/ingredient.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { supplierService } from '../suppliers/supplier.service.js';
import { MOVEMENT_TYPES } from '../inventory/inventory.model.js';

export const purchaseService = {
  async list() {
    const purchases = await storage.getAll(PURCHASE_COLLECTION);
    return purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async get(id) {
    return storage.getById(PURCHASE_COLLECTION, id);
  },

  /**
   * Registra la compra: por cada línea, suma stock en Inventario y
   * actualiza el costo del ingrediente al precio pagado. Todo o nada — si
   * una línea falla a mitad de camino, se revierte lo ya aplicado.
   */
  async create(data) {
    validatePurchase(data);

    const supplier = await supplierService.get(data.supplierId);
    if (!supplier) throw new NotFoundError('El proveedor seleccionado no existe.');

    const ingredients = await ingredientService.list();
    const ingredientsById = new Map(ingredients.map((i) => [i.id, i]));

    await runAtomic(data.items.map((item) => {
      const ingredient = ingredientsById.get(item.ingredientId);
      if (!ingredient) throw new NotFoundError(`El ingrediente de una de las líneas ya no existe.`);
      const previousCost = ingredient.cost;

      return {
        run: async () => {
          await inventoryService.create({
            ingredientId: item.ingredientId,
            type: MOVEMENT_TYPES.IN,
            quantity: item.quantity,
            reason: `Compra a ${supplier.name}`,
          });
          const current = await ingredientService.get(item.ingredientId);
          await ingredientService.update(item.ingredientId, { ...current, cost: item.unitCost });
        },
        rollback: async () => {
          await inventoryService.create({
            ingredientId: item.ingredientId,
            type: MOVEMENT_TYPES.OUT,
            quantity: item.quantity,
            reason: 'Reversión automática: compra no se pudo completar',
          });
          const current = await ingredientService.get(item.ingredientId);
          await ingredientService.update(item.ingredientId, { ...current, cost: previousCost });
        },
      };
    }));

    const purchase = await storage.create(PURCHASE_COLLECTION, data);
    eventBus.emit(EVENTS.PURCHASE_CREATED, purchase);
    return purchase;
  },

  async listSuppliersForForm() {
    return supplierService.list();
  },

  async listIngredientsForForm() {
    return ingredientService.list();
  },
};
