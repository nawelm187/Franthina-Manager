/**
 * dashboard.service.js
 * Responsabilidad: agregar métricas de negocio para el panel principal.
 * Consume los Services públicos de otros módulos (nunca sus renderers/controllers
 * internos) — esta es la única forma permitida de comunicación entre módulos
 * además del eventBus.
 */

import { productService } from '../products/product.service.js';
import { ingredientService } from '../ingredients/ingredient.service.js';
import { recipeService } from '../recipes/recipe.service.js';
import { productionService } from '../production/production.service.js';
import { ORDER_STATUS as PRODUCTION_STATUS } from '../production/production.model.js';
import { customerService } from '../customers/customer.service.js';
import { saleService } from '../sales/sale.service.js';
import { cashboxService } from '../cashbox/cashbox.service.js';
import { orderService } from '../orders/order.service.js';
import { ORDER_STATUS } from '../orders/order.model.js';

export const dashboardService = {
  async getSummary() {
    const [products, ingredients, recipes, productionOrders, customers, todaySalesTotal, activeCashboxSession, orders] = await Promise.all([
      productService.list(),
      ingredientService.list(),
      recipeService.list(),
      productionService.list(),
      customerService.list(),
      saleService.getTodayTotal(),
      cashboxService.getActiveSession(),
      orderService.list(),
    ]);

    const activeProducts = products.filter((p) => p.active);
    const lowStockIngredients = ingredients.filter((i) => ingredientService.isLowStock(i));
    const pendingProduction = productionOrders.filter((o) => o.status === PRODUCTION_STATUS.PLANNED);
    const pendingOrders = orders.filter((o) => o.status === ORDER_STATUS.PENDING);
    const avgMargin = activeProducts.length
      ? Math.round(activeProducts.reduce((sum, p) => sum + productService.margin(p), 0) / activeProducts.length)
      : 0;

    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      totalIngredients: ingredients.length,
      totalRecipes: recipes.length,
      pendingProduction: pendingProduction.length,
      totalCustomers: customers.length,
      todaySalesTotal,
      cashboxOpen: Boolean(activeCashboxSession),
      pendingOrders: pendingOrders.length,
      lowStockIngredients,
      avgMargin,
    };
  },
};
