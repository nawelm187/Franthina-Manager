# Módulo: Ingredientes

## Objetivo
Controlar stock, costo y proveedor de cada ingrediente usado en producción.

## Responsabilidades
- ✅ CRUD completo con validación centralizada.
- ✅ Detección de stock bajo (`ingredientService.isLowStock`) y emisión del
  evento `ingredient:low-stock`.
- ✅ Detección de nombres duplicados (`findDuplicateIngredientName()`,
  `ingredient.controller.js`) — ignora mayúsculas y acentos, así que
  "Harina", "harina" y "HARINA" se detectan como el mismo ingrediente
  antes de crear uno nuevo. Vive en el Controller, no en el Service: el
  Service no bloquea duplicados por diseño (mismo criterio que las guardas
  de integridad referencial, ver `docs/ARCHITECTURE.md`).
- ❌ NO gestiona movimientos de stock directamente (eso es `inventory`, que
  actualiza el stock del ingrediente a través de `ingredientService.update()`).
- ❌ NO gestiona compras a proveedores directamente (eso es `purchases`,
  mismo patrón: pasa por `ingredientService`/`inventoryService`, nunca toca
  storage de Ingredientes).

## Estructura
Mismo patrón que `modules/products/`: model, validator, service, renderer,
controller, index. Ver `docs/module-products.md` para el detalle de cada capa.

## Dependencias
`ingredient.service.js` no depende de ningún otro módulo — es una hoja del
grafo de dependencias (ver `docs/ARCHITECTURE.md`).

`ingredient.controller.js` (no el Service) lee `recipeService.list()` para
impedir borrar un ingrediente que una receta está usando — ver
`docs/ARCHITECTURE.md`, sección "Guardas de integridad referencial", para
por qué esta lectura vive en el Controller y no crea una dependencia
circular con `recipes -> ingredients`.

## Eventos emitidos
`ingredient:created`, `ingredient:updated`, `ingredient:deleted`,
`ingredient:low-stock`.

## Próximos pasos (roadmap)
- Fecha de vencimiento y lote.
- Historial de precios (costo promedio vs. último costo).
- Alertas automáticas en el Dashboard con severidad.
