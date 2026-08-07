/**
 * ingredient.service.js
 * Responsabilidad: lógica de negocio de Ingredientes.
 * Detecta y emite alertas de stock bajo — esto es lo que el futuro módulo de
 * Dashboard y Producción consumirán vía eventBus, sin acoplarse a este módulo.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { INGREDIENT_COLLECTION } from './ingredient.model.js';
import { validateIngredient } from './ingredient.validator.js';

/** @param {object} item */
function isLowStock(item) {
  return item.stock <= item.minStock;
}

/** Emite la alerta de stock bajo si corresponde. Función interna del módulo, no exportada. */
function checkLowStock(item) {
  if (isLowStock(item)) {
    eventBus.emit(EVENTS.INGREDIENT_LOW_STOCK, item);
  }
}

export const ingredientService = {
  async list() {
    const items = await storage.getAll(INGREDIENT_COLLECTION);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },

  async get(id) {
    return storage.getById(INGREDIENT_COLLECTION, id);
  },

  async create(data) {
    validateIngredient(data);
    const item = await storage.create(INGREDIENT_COLLECTION, data);
    eventBus.emit(EVENTS.INGREDIENT_CREATED, item);
    checkLowStock(item);
    return item;
  },

  async update(id, data) {
    validateIngredient(data);
    const item = await storage.update(INGREDIENT_COLLECTION, id, data);
    eventBus.emit(EVENTS.INGREDIENT_UPDATED, item);
    checkLowStock(item);
    return item;
  },

  async remove(id) {
    await storage.remove(INGREDIENT_COLLECTION, id);
    eventBus.emit(EVENTS.INGREDIENT_DELETED, { id });
  },

  isLowStock,
};
