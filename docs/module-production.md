# Módulo: Producción

## Objetivo
Planificar lotes de producción a partir de una receta, verificar si hay stock
suficiente antes de ejecutar, descontar automáticamente los ingredientes
usados al completar la orden, **y sumar las unidades producidas al stock del
producto vinculado a esa receta, si hay uno.**

## Responsabilidades
- ✅ Crear órdenes planificadas (`status: planned`) con receta + multiplicador de lotes.
- ✅ Chequeo de factibilidad de solo lectura (`checkFeasibility`) — se usa tanto
  en la vista previa en vivo del formulario como antes de completar una orden.
  Convierte automáticamente la cantidad de cada línea de la receta a la
  unidad del ingrediente antes de comparar contra el stock (ver
  `core/units.js` y `docs/module-recipes.md`).
- ✅ Completar una orden: **todo o nada**, en una única operación atómica con
  dos efectos:
  1. Descuenta cada ingrediente consumido (vía `inventoryService.create()`,
     nunca tocando `ingredientService.update()` directamente).
  2. Suma `recipe.yieldQuantity × order.multiplier` unidades al stock de
     cualquier Producto con `recipeId` apuntando a esta receta (vía
     `productService.update()`).

  Si falla cualquier paso (falta stock, o falla algo a mitad de camino), no
  queda nada a medio aplicar — `runAtomic()` revierte todo lo ya hecho
  (ver `docs/ARCHITECTURE.md`, sección de `atomicRun`).
- ✅ Una orden completada es inmutable (no se puede eliminar, es historial;
  mismo criterio que los movimientos de Inventario).
- ❌ NO genera automáticamente una lista de compras cuando falta stock — el
  chequeo de factibilidad ya da esa información (`requirements` con `enough:
  false`); armar una lista de compras formal queda para el módulo `purchases`.
- ❌ Si una receta no tiene ningún Producto vinculado, completar la orden
  solo descuenta ingredientes (no hay ningún stock de producto que sumar) —
  comportamiento intencional, no un caso de error.

## Cómo se comunica con otros módulos
Únicamente a través de sus Services públicos:
- Lee `recipeService.get()` y `recipeService.list()` para conocer las recetas.
- Lee `ingredientService.list()` para el stock actual.
- Escribe stock de ingredientes exclusivamente llamando a
  `inventoryService.create()` — nunca a `ingredientService.update()`
  directamente, para que todo descuento de producción quede también
  registrado como movimiento auditable en Inventario.
- Lee `productService.list()`/`get()` y escribe con `productService.update()`
  para sumar el stock producido. Dependencia nueva `production -> products`,
  sin ciclo (Productos no depende de Producción).

## Eventos emitidos
`production:order-created`, `production:order-completed`, `production:order-cancelled`.

## Próximos pasos (roadmap)
- Generar automáticamente una lista de compras con los faltantes detectados.
- Tiempo estimado de producción (usa `recipe.prepTimeMinutes × multiplier`).
- Vista de calendario/agenda de producción.
- Es el punto natural para reevaluar migrar el stock de Ingredientes a 100%
  derivado del historial de movimientos (ver `docs/module-inventory.md`).
