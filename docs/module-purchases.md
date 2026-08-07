# Módulo: Compras

## Objetivo
Registrar compras a proveedores, conectando automáticamente Inventario
(entrada de stock) y el costo de cada ingrediente — que es exactamente lo
que después usan Recetas para calcular su costo y Producción para verificar
factibilidad.

## Cómo conecta Inventario, Ingredientes y Recetas sin acoplarse a ellos
Por cada línea de la compra:
1. Genera un movimiento de entrada en Inventario vía
   `inventoryService.create()` — Inventario internamente actualiza el stock
   del ingrediente a través de `ingredientService.update()`, igual que
   cualquier otro movimiento.
2. Actualiza el costo del ingrediente (`ingredientService.update()`) al
   precio pagado en esta compra.

Compras nunca importa `recipe.service.js` ni sabe que Recetas existe — el
efecto de "las recetas ahora cuestan lo que cuestan los ingredientes
actualizados" ocurre solo porque Recetas siempre lee el costo vigente de
cada ingrediente al calcular (`recipeService.calculateCost`), nunca un
precio guardado en el momento de crear la receta.

## Responsabilidades
- ✅ Todo o nada con rollback (`runAtomic`): si una línea falla a mitad de
  camino, se revierte el movimiento de inventario ya creado (con uno de
  salida compensatorio) y el costo del ingrediente vuelve a su valor previo.
- ❌ NO compara precios entre proveedores todavía (el brief original lo
  pide — "comparar proveedores" — queda para cuando haya más de una compra
  del mismo ingrediente a distintos proveedores para comparar).
- ❌ NO registra facturas ni gastos generales (solo compras de ingredientes)
  — gastos operativos se registran hoy como egresos manuales en Caja.

## Eventos emitidos
`purchase:created`.

## Próximos pasos (roadmap)
- Comparar el último precio pagado por ingrediente entre proveedores.
- Registrar el número de factura/comprobante.
- Alertas de compra sugerida (conectar con
  `productionService.checkFeasibility()` para armar una lista de compras
  automática a partir de los faltantes detectados).
