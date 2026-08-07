# Reglas de negocio e invariantes

Una invariante es algo que nunca debe dejar de cumplirse, sin importar qué
camino del código se ejecute. Esto no es documentación aspiracional: cada
regla de acá ya está implementada y probada — la tabla dice dónde de cada
cosa, para que si algo deja de cumplirse algún día, se note enseguida.

| # | Regla | Dónde se cumple | Dónde se prueba |
|---|---|---|---|
| 1 | Un producto tiene como máximo una receta vinculada | `product.model.js` — `recipeId` es un campo único, no una lista; estructuralmente no admite más de una | `docs/module-products.md` |
| 2 | Una receta nunca puede contener el mismo ingrediente dos veces | `recipe.validator.js` — `Set(ids).size !== ids.length` | `tests/integration` — "Una receta con el mismo ingrediente listado dos veces se rechaza" |
| 3 | Una venta confirmada no puede eliminarse ni editarse | No existe `remove()`/`update()` en `sale.service.js` — decisión de diseño, no una omisión (ver `docs/module-sales.md`) | — (ausencia verificada por inspección; no hay una función que probar) |
| 4 | El stock de un ingrediente nunca puede quedar negativo | `inventory.service.js` — `Math.max(0, ...)` en ajustes, y rechazo explícito con `InsufficientStockError` si una salida manual excede el stock disponible | "QA: movimiento manual de salida que excede el stock disponible se rechaza" |
| 5 | El total de una venta siempre es la suma de sus ítems (menos descuento) | `calculateSaleTotal()` en `sale.model.js` — el total nunca se guarda independiente, siempre se deriva de `items` | "El total de la venta se calcula correctamente" |
| 6 | Una producción nunca consume más ingrediente del disponible | `productionService.checkFeasibility()` bloquea con `InsufficientStockError` antes de escribir nada | "Producción ×100 correctamente detecta que NO hay stock suficiente" |
| 7 | No se puede eliminar una receta vinculada a un producto | Guarda en `recipe.controller.js` (`findProductsUsingRecipe`) — ver `docs/ARCHITECTURE.md`, "Guardas de integridad referencial" | "findProductsUsingRecipe() detecta correctamente el producto vinculado" |
| 8 | No se puede eliminar un ingrediente usado en una receta | Guarda en `ingredient.controller.js` (`findRecipesUsingIngredient`) | "findRecipesUsingIngredient() detecta correctamente la receta que usa Harina" |
| 9 | Solo puede haber una caja abierta a la vez | `cashboxService.open()` rechaza si ya hay una sesión activa | "No se puede abrir una segunda caja mientras hay una abierta" |
| 10 | Una caja cerrada no puede volver a cerrarse | `cashboxService.close()` valida `status === OPEN` antes de proceder | "No se puede volver a cerrar una caja ya cerrada" |
| 11 | Los movimientos de Inventario y Caja son append-only | No existen `update()`/`remove()` para movimientos — una corrección se hace con un movimiento nuevo, nunca reescribiendo el pasado | — (ausencia verificada por inspección) |
| 12 | Una orden de producción completada es inmutable | `productionService.remove()` rechaza si `status === COMPLETED` | `docs/module-production.md` |
| 13 | El costo de una receta siempre refleja el costo *vigente* de sus ingredientes, nunca uno cacheado | `recipeService.calculateCost()` se recalcula al vuelo en cada llamada, nunca se persiste | "El costo de la receta sube automáticamente al recalcularse con el nuevo costo de Harina" |
| 14 | Cantidades y precios nunca son negativos | `core/validators.js` (`isNonNegativeNumber`, `isPositiveNumber`), aplicado en los 8 validadores de módulo | "Errores tipados y validadores compartidos" |
| 15 | Producción/Ventas/Pedidos son todo-o-nada: si falta stock, no se descuenta nada | `core/storage/atomicRun.js`, con rollback si un paso falla a mitad de camino | "Rollback atómico (core/storage/atomicRun.js)" |
| 16 | Una conversión de unidades nunca mezcla dimensiones distintas (masa con volumen) | `core/units.js` — `convertUnit()` lanza un error explícito si las dimensiones no coinciden | "convertUnit() lanza un error explícito al intentar convertir masa a volumen" |

## Por qué esta tabla y no solo los tests

Los tests prueban que la regla se cumple *hoy*. Esta tabla existe para que
la regla se entienda *como regla* antes de tocar el código — alguien que
lea `recipe.validator.js` sin este documento podría ver el chequeo de
duplicados como una validación más, no como una invariante que nunca debe
poder saltarse. La distinción importa a la hora de decidir si un refactor
futuro es seguro: tocar una validación de formulario es más liviano que
tocar una invariante de negocio.

## Lo que se evaluó y no se adoptó: separar completamente "dato" de "evento"

Ingredientes y Caja ya distinguen dato (`stock`, `openingAmount`) de evento
(movimientos de Inventario, movimientos de Caja). Productos y Recetas no:
mantienen solo su dato actual (`stock`, `costPrice`), sin un historial de
eventos que lo explique. Migrar todo el proyecto a un modelo 100%
event-sourced (donde el dato siempre se deriva de un log de eventos, nunca
se guarda directo) es una reescritura de fondo, no una mejora incremental —
se evaluó y se decidió no encararla sin un problema concreto que la
justifique (por ejemplo, necesitar responder "por qué cambió este costo" de
forma completa, no solo "cuál es el costo ahora"). Queda documentada acá
como decisión consciente, no como pendiente olvidado.

## Ver también
- `docs/ARCHITECTURE.md` — decisiones de arquitectura y convenciones.
- `docs/EVENTS.md` — catálogo de eventos del `eventBus`.
- `tests/integration/integration.test.mjs` — donde se verifica cada regla.
