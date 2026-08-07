# Módulo: Productos

## Objetivo
Administrar el catálogo de productos de Franthina: nombre, categoría, precio de
costo, precio de venta, stock y estado (activo/inactivo). Opcionalmente, un
producto puede vincularse a una Receta para sincronizar su costo con ella.

## Responsabilidades
- ✅ CRUD completo de productos con validación centralizada.
- ✅ Cálculo de margen de ganancia derivado (nunca se persiste, siempre se calcula).
- ✅ Búsqueda instantánea por nombre, insensible a mayúsculas y acentos
  (`normalizeForSearch()`, `core/utils.js`).
- ✅ Detección de nombres duplicados (`findDuplicateProductName()`, mismo
  patrón y misma ubicación en el Controller que en Ingredientes).
- ✅ Vínculo opcional a una Receta (`recipeId`) + `syncCostFromRecipe()`:
  recalcula `costPrice` a partir del costo actual de la receta. Es una
  acción explícita del usuario (un botón), nunca automática — así un
  producto puede seguir teniendo un costo manual distinto al de su receta
  si hace falta, sin que se pise solo en cada carga de pantalla.
- ❌ NO gestiona movimientos de inventario (eso pertenece a `inventory`, y
  aplica a ingredientes, no a productos terminados).

## Estructura de archivos
| Archivo | Responsabilidad única |
|---|---|
| `product.model.js` | Forma de los datos y valores por defecto |
| `product.validator.js` | Todas las reglas de validación |
| `product.service.js` | Lógica de negocio + comunicación con `storage` |
| `product.renderer.js` | Genera HTML — nunca toca `storage` |
| `product.controller.js` | Coordina Service + Renderer + eventos del DOM |
| `index.js` | Única puerta de entrada pública para el Router |

## Dependencias permitidas
`core/storage`, `core/eventBus`, `core/errors`, `core/utils`, `components/*`,
y el Service público de `recipes` (`recipeService`) — únicamente para
`syncCostFromRecipe()` y para poblar el selector de receta del formulario.
Nunca se importa `recipe.renderer.js` ni `recipe.controller.js`, ni se toca
el storage de Recetas directamente.

## Por qué esto no es una dependencia circular
`products -> recipes -> ingredients`. Recetas no conoce Productos (nunca lo
importa), así que no hay ciclo. Ver el grafo completo de dependencias en
`docs/ARCHITECTURE.md`.

## Eventos emitidos
`product:created`, `product:updated`, `product:deleted` (ver `core/eventBus.js`).

## Próximos pasos (roadmap)
- Código de barras / QR.
- Galería de imágenes.
- Precios diferenciados (mayorista, feria, promocional).
- Duplicar producto / archivar producto.
- Historial de cambios (requiere módulo transversal de auditoría).
- Evaluar si `syncCostFromRecipe()` debería ofrecerse también como acción
  masiva ("sincronizar todos los productos vinculados") cuando el catálogo
  crezca lo suficiente como para que hacerlo uno por uno sea tedioso.
