# Storage: qué guarda cada colección

Fuente de verdad de los nombres: `core/constants/storageKeys.js`. Esta tabla
documenta la forma de cada colección tal como la define su `*.model.js` —
si un modelo cambia, este documento se actualiza en el mismo commit.

Todos los registros de una colección comparten estos campos, agregados
automáticamente por `LocalStorageAdapter` (nunca los setea el módulo de
negocio): `id`, `createdAt`, `updatedAt`.

| Colección | Módulo dueño | Forma (campos propios del dominio) |
|---|---|---|
| `products` | Productos | `name, category, recipeId (opcional), costPrice, sellPrice, stock, active, notes` |
| `ingredients` | Ingredientes | `name, unit, stock, minStock, cost, supplier, notes` |
| `recipes` | Recetas | `name, items: [{ingredientId, quantity, unit}], yieldQuantity, yieldUnit, prepTimeMinutes, notes, version` — `unit` puede ser distinto a la unidad del ingrediente (ver `core/units.js`) |
| `inventory_movements` | Inventario | `ingredientId, type (in\|out\|adjust\|waste), quantity, reason` — append-only, nunca se edita |
| `production_orders` | Producción | `recipeId, multiplier, status (planned\|completed\|cancelled), plannedDate, notes, completedAt` |
| `customers` | Clientes | `name, phone, email, address, birthday, notes` |
| `sales` | Ventas | `customerId, items: [{productId, quantity, unitPrice}], paymentMethod, discount (no editable desde el form, ver docs/module-sales.md), amountReceived (opcional, solo efectivo), notes, total` |
| `cashbox_sessions` | Caja | `status (open\|closed), openingAmount, closingAmountCounted, expectedAmount, difference, closedAt, notes` |
| `cashbox_movements` | Caja | `sessionId, type (income\|expense\|sale), amount, reason` — append-only |
| `orders` | Pedidos | `customerId, items: [{productId, quantity, unitPrice}], deliveryDate, depositAmount, status (pending\|delivered\|cancelled), notes, deliveredAt, productionOrderId, total` |
| `suppliers` | Proveedores | `name, contactName, phone, email, leadTimeDays, notes` |
| `purchases` | Compras | `supplierId, items: [{ingredientId, quantity, unitCost}], notes` |
| `system_logs` | `core/logger.js` | `level (info\|warning\|error), message, meta` — no se incluye en los backups (ver `core/backup.js`), es diagnóstico técnico, no dato de negocio |

## Valores sueltos (no colecciones)

Guardados vía `storage.getMeta()`/`setMeta()`, no como registros con `id`:

| Clave | Quién la usa | Contenido |
|---|---|---|
| `schemaVersion` | `core/storage/migrations.js` | número entero de versión de esquema aplicada |
| `a11yPrefs` | `core/state.js` | `{ textSize, contrast, spacing, reduceMotion, theme }` |

## Cómo ver la forma exacta de un registro

Este documento es un resumen. La fuente de verdad real, con tipos y
comentarios, es el `@typedef` JSDoc en cada `*.model.js` — por ejemplo
`modules/orders/order.model.js` para `Order`. Si hay alguna diferencia entre
esta tabla y el código, gana el código.
