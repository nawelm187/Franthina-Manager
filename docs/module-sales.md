# Módulo: Ventas

## Objetivo
Registrar ventas rápidas con carrito de productos, descuento de stock
automático, cálculo de vuelto en efectivo, y reflejo inmediato en Caja.

## Decisión de diseño: stock de Productos sigue siendo un campo simple
A diferencia de Ingredientes (que tiene Inventario con historial de
movimientos), Productos mantiene su campo `stock` editable simple. Ventas lo
descuenta llamando a `productService.update()` con el nuevo valor calculado.
Desde que existe Producción (que también escribe stock de Productos al
completar una orden), este patrón simple sigue alcanzando: ambos módulos
pasan siempre por `productService.update()`, nunca tocan storage directo.

## El formulario de carga: qué muestra y por qué
- ✅ Carrito con líneas dinámicas (agregar/quitar productos sin límite),
  autocompletando el precio sugerido del producto (editable: una venta
  puede llevar un precio distinto al de lista), con el **subtotal de cada
  línea calculado en vivo** (cantidad × precio unitario).
- ✅ Campo "¿Con cuánto paga?" (efectivo recibido) — aparece únicamente
  cuando el método de pago es Efectivo (se oculta para Tarjeta/Transferencia,
  donde no existe el concepto de vuelto). Calcula el vuelto en vivo: verde
  si alcanza, rojo con el faltante si no alcanza.
- ❌ El campo de "Descuento" que existía en versiones anteriores se sacó del
  formulario a pedido explícito: generaba confusión en el flujo normal de
  venta (contar unidades, calcular total, cobrar, dar vuelto). El campo
  `discount` sigue existiendo en `sale.model.js` con valor `0` fijo desde
  este formulario — no se eliminó de la capa de datos por si en el futuro
  se necesita para combos/promociones, pero hoy nadie lo edita.

## Responsabilidades del Service
- ✅ Verificación de stock **todo o nada** antes de confirmar — si falta
  stock de cualquier producto, no se descuenta nada y se informa el detalle
  (`InsufficientStockError`, la misma clase que usa Producción).
- ✅ Si el pago es en efectivo y se cargó un monto recibido, se valida que
  alcance para cubrir el total (`sale.validator.js`) — si no alcanza, se
  bloquea con un mensaje claro en vez de guardar una venta con vuelto negativo.
- ✅ Si hay una caja abierta, registra el ingreso automáticamente
  (`cashboxService.registerAutoMovement`). Si no hay caja abierta, la venta
  se concreta igual — la caja es un control operativo, no un requisito para
  vender.
- ✅ `getTodayTotal()` para el widget del Dashboard.
- ❌ NO gestiona cuotas ni señas (eso es Pedidos, para ventas con entrega
  diferida — ver `docs/module-orders.md`).

## Eventos emitidos
`sale:created`.

## Próximos pasos (roadmap)
- Escáner de código de barras / QR para agregar productos al carrito.
- Combos y promociones (momento en el que `discount` volvería a exponerse
  en el formulario, probablemente como parte de un flujo distinto al actual).
- Reimpresión de comprobante y cancelación de ventas.
- Mostrar el efectivo recibido/vuelto también en el historial de ventas
  (hoy se guarda en el registro pero la tabla de listado no lo muestra).
