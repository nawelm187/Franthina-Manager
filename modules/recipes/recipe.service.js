/**
 * recipe.service.js
 * Responsabilidad: lógica de negocio de Recetas, incluido el cálculo de costo.
 * Consume ingredientService (Service público de otro módulo) únicamente para
 * lectura de costos — nunca escribe en Ingredientes desde acá.
 */

import { storage } from '../../core/storage/index.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { RECIPE_COLLECTION } from './recipe.model.js';
import { validateRecipe } from './recipe.validator.js';
import { ingredientService } from '../ingredients/ingredient.service.js';
import { convertUnit } from '../../core/units.js';

export const recipeService = {
  async list() {
    const recipes = await storage.getAll(RECIPE_COLLECTION);
    return recipes.sort((a, b) => a.name.localeCompare(b.name));
  },

  async get(id) {
    return storage.getById(RECIPE_COLLECTION, id);
  },

  async create(data) {
    validateRecipe(data);
    const recipe = await storage.create(RECIPE_COLLECTION, { ...data, version: 1 });
    eventBus.emit(EVENTS.RECIPE_CREATED, recipe);
    return recipe;
  },

  async update(id, data) {
    validateRecipe(data);
    const existing = await storage.getById(RECIPE_COLLECTION, id);
    const nextVersion = (existing?.version ?? 1) + 1;
    const recipe = await storage.update(RECIPE_COLLECTION, id, { ...data, version: nextVersion });
    eventBus.emit(EVENTS.RECIPE_UPDATED, recipe);
    return recipe;
  },

  async remove(id) {
    await storage.remove(RECIPE_COLLECTION, id);
    eventBus.emit(EVENTS.RECIPE_DELETED, { id });
  },

  /**
   * Calcula el costo total y por unidad de una receta a partir del costo
   * actual de cada ingrediente. Nunca se persiste: siempre se recalcula al vuelo,
   * así refleja automáticamente cualquier cambio de precio de un ingrediente.
   * Convierte automáticamente si la línea de la receta está cargada en una
   * unidad distinta a la del ingrediente (ej. ingrediente en "kg", receta en
   * "g") — ver core/units.js.
   * @param {import('./recipe.model.js').Recipe} recipe
   * @param {import('../ingredients/ingredient.model.js').Ingredient[]} allIngredients - ya cargados, para no golpear storage por cada item
   */
  calculateCost(recipe, allIngredients) {
    const ingredientsById = new Map(allIngredients.map((i) => [i.id, i]));
    let totalCost = 0;
    const missing = [];
    const incompatibleUnits = [];

    for (const item of recipe.items) {
      const ingredient = ingredientsById.get(item.ingredientId);
      if (!ingredient) {
        missing.push(item.ingredientId);
        continue;
      }
      const itemUnit = item.unit || ingredient.unit;
      let quantityInIngredientUnit;
      try {
        quantityInIngredientUnit = convertUnit(item.quantity, itemUnit, ingredient.unit);
      } catch {
        incompatibleUnits.push(item.ingredientId);
        continue;
      }
      totalCost += ingredient.cost * quantityInIngredientUnit;
    }

    const costPerUnit = recipe.yieldQuantity > 0 ? totalCost / recipe.yieldQuantity : 0;
    return { totalCost, costPerUnit, missing, incompatibleUnits };
  },

  /** Trae todos los ingredientes necesarios de una vez, evita N llamadas a storage. */
  async listIngredientsForCosting() {
    return ingredientService.list();
  },
};
