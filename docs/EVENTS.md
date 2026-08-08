# Catálogo de eventos (`core/eventBus.js`)

La única fuente de verdad de los nombres de evento es `EVENTS` en
`core/eventBus.js`. Esta tabla documenta quién emite cada uno, con qué
payload, y quién escucha — generada leyendo el código real, no de memoria.
Si agregás un evento nuevo, agregalo también acá en el mismo commit.

| Evento | Emitido por | Payload | Escuchado por |
|---|---|---|---|
| `product:created` | `product.service.js` → `create()` | el producto creado | nadie todavía (disponible para notificaciones futuras) |
| `product:updated` | `product.service.js` → `update()` | el producto actualizado | nadie todavía |
| `product:deleted` | `product.service.js` → `remove()` | `{ id }` | nadie todavía |
| `ingredient:created` | `ingredient.service.js` → `create()` | el ingrediente creado | nadie todavía |
| `ingredient:updated` | `ingredient.service.js` → `update()` | el ingrediente actualizado | nadie todavía |
| `ingredient:deleted` | `ingredient.service.js` → `remove()` | `{ id }` | nadie todavía |
| `ingredient:low-stock` | `ingredient.service.js` → `create()`/`update()`, cuando el stock queda por debajo del mínimo | el ingrediente | nadie todavía (el Dashboard hoy lo consulta por polling vía `list()`, no por evento — candidato a mejora) |
| `recipe:created` | `recipe.service.js` → `create()` | la receta creada | nadie todavía |
| `recipe:updated` | `recipe.service.js` → `update()` | la receta actualizada | nadie todavía |
| `recipe:deleted` | `recipe.service.js` → `remove()` | `{ id }` | nadie todavía |
| `inventory:movement-created` | `inventory.service.js` → `create()` | el movimiento creado | nadie todavía |
| `production:order-created` | `production.service.js` → `create()` | la orden creada | nadie todavía |
| `production:order-completed` | `production.service.js` → `complete()` | la orden completada | nadie todavía |
| `production:order-cancelled` | `production.service.js` → `cancel()` | la orden cancelada | nadie todavía |
| `customer:created` | `customer.service.js` → `create()` | el cliente creado | nadie todavía |
| `customer:updated` | `customer.service.js` → `update()` | el cliente actualizado | nadie todavía |
| `customer:deleted` | `customer.service.js` → `remove()` | `{ id }` | nadie todavía |
| `cashbox:opened` | `cashbox.service.js` → `open()` | la sesión abierta | nadie todavía |
| `cashbox:closed` | `cashbox.service.js` → `close()` | la sesión cerrada, con `expectedAmount`/`difference` calculados | nadie todavía |
| `cashbox:movement-created` | `cashbox.service.js` → `addMovement()` y `registerSaleMovement()` | el movimiento creado | nadie todavía |
| `sale:created` | `sale.service.js` → `create()` | la venta creada, con `total` | nadie todavía |
| `order:created` | `order.service.js` → `create()` | el pedido creado, con `total` | nadie todavía |
| `order:delivered` | `order.service.js` → `markDelivered()` | el pedido entregado | nadie todavía |
| `order:cancelled` | `order.service.js` → `cancel()` | el pedido cancelado | nadie todavía |
| `supplier:created` | `supplier.service.js` → `create()` | el proveedor creado | nadie todavía |
| `supplier:updated` | `supplier.service.js` → `update()` | el proveedor actualizado | nadie todavía |
| `supplier:deleted` | `supplier.service.js` → `remove()` | `{ id }` | nadie todavía |
| `purchase:created` | `purchase.service.js` → `create()` | la compra creada | nadie todavía |
| `route:changed` | `core/router.js`, en cada navegación | el `pathname` actual | `app.js` (resalta el link activo en el nav, y reconstruye el chrome tienda/admin si cambió de zona) |
| `a11y:changed` | `core/state.js` → `setA11yPref()` | las preferencias de accesibilidad completas | `app.js` (aplica las clases de accesibilidad al `<html>`) |
| `cart:changed` | `core/storeCart.js`, en cada cambio al carrito de la tienda | el array de líneas del carrito | `app.js` (actualiza el número en el ícono del carrito del header de la tienda) |
| `backup:exported` | `core/backup.js` → `downloadBackup()` | `{ filename, exportedAt }` | nadie todavía |
| `backup:restored` | `core/backup.js` → `restoreBackup()` | `{ exportedAt, collections }` | nadie todavía |
| `toast:show` | `core/errors.js` → `handleError()`, y cualquier módulo que llame `showToast()` directamente | `{ type, message }` | `components/toast.js` (único lugar que efectivamente pinta el toast) |

## Por qué la mayoría de los eventos de dominio "no los escucha nadie todavía"

Se emiten igual, aunque hoy no tengan un listener, porque:
1. Son la forma correcta en que un futuro módulo (por ejemplo, un centro de
   notificaciones, o Auditoría/historial del ROADMAP) se engancharía sin que
   el módulo emisor tenga que cambiar una sola línea.
2. El Dashboard, por simplicidad del MVP, hoy consulta los `Service`
   directamente (`list()`) en vez de suscribirse a estos eventos — es una
   decisión válida mientras solo haya una pantalla que agregue datos de
   varios módulos a la vez; si en el futuro se necesita que el Dashboard se
   actualice en vivo sin recargar, ahí es donde se conectarían estos eventos.
