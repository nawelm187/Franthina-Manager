# Módulo: Recetas

## Objetivo
Definir recetas profesionales con costo calculado automáticamente a partir del
precio actual de cada ingrediente.

## Responsabilidades
- ✅ CRUD completo con líneas de ingredientes dinámicas (agregar/quitar sin límite).
- ✅ Costo total y costo por unidad calculados **al vuelo**, nunca persistidos —
  así reflejan automáticamente cualquier cambio futuro de precio en Ingredientes.
- ✅ **Conversión de unidades**: cada línea de la receta puede cargarse en
  cualquier unidad compatible con la del ingrediente (masa: g/kg, volumen:
  ml/l) — el ejemplo típico es un ingrediente que se compra y se stockea
  en kg, pero cuya cantidad en una receta puntual conviene cargar en
  gramos. La conversión (`core/units.js`) es automática tanto para el
  costo como para el consumo en Producción. Mezclar dimensiones (masa con
  volumen) se bloquea al guardar, con un mensaje claro.
- ✅ Rechaza una receta con el mismo ingrediente listado dos veces
  (`recipe.validator.js`) — hay que consolidarlo en una sola línea con la
  cantidad sumada, evita un doble conteo silencioso en el costo.
- ✅ Versionado simple: cada edición incrementa `recipe.version` (base para un
  futuro historial completo de cambios).
- ❌ NO descuenta stock de ingredientes al "usar" una receta — eso es
  responsabilidad del futuro módulo `production`, que sí escribirá en
  Inventario a través de `inventoryService`.

## Estructura
Mismo patrón que los módulos anteriores. La complejidad extra vive en
`recipe.controller.js`: maneja las filas de ingredientes dinámicas del
formulario con delegación de eventos (un solo listener en el contenedor,
no uno por fila) y recalcula el costo en vivo mientras el usuario edita.

## Dependencias
`recipe.service.js` lee `ingredientService.list()` para costeo y para
poblar el selector de ingredientes. Nunca escribe en Ingredientes.

`recipe.controller.js` (no el Service) lee `productService.list()` para
impedir borrar una receta que un producto tiene vinculada — ver
`docs/ARCHITECTURE.md`, sección "Guardas de integridad referencial", para
por qué esta lectura vive en el Controller y no crea una dependencia
circular con `products -> recipes`.

## Eventos emitidos
`recipe:created`, `recipe:updated`, `recipe:deleted`.

## Próximos pasos (roadmap)
- Costos adicionales: empaque, etiquetas, energía, gas, mano de obra.
- Escalado automático (recalcular cantidades para otro rendimiento).
- Historial completo de versiones (no solo el número), con posibilidad de
  restaurar una versión anterior.
- Plantillas de receta reutilizables.
