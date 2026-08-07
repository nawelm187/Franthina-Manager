# Módulo: Pedidos

## Objetivo
Pedidos con entrega futura: a diferencia de una Venta (pago y entrega
inmediatos), un Pedido admite seña, saldo pendiente y una fecha de entrega.

## Responsabilidades
- ✅ Cliente obligatorio (a diferencia de Ventas, que admite "consumidor final").
- ✅ Seña opcional al crear el pedido: si hay caja abierta, se refleja como
  ingreso automáticamente (`cashboxService.registerAutoMovement`).
- ✅ `markDelivered()`: verifica stock (todo o nada, con rollback vía
  `runAtomic` si falla a mitad de camino), descuenta stock de cada producto,
  y refleja el saldo pendiente en Caja.
- ✅ `linkProduction()`: puede generar una orden de producción vinculada,
  a través del Service público de Producción.
- ❌ NO permite pagos parciales múltiples (solo seña + saldo final al
  entregar) — pagos en cuotas queda para una futura iteración si hace falta.
- ❌ NO revierte automáticamente la seña ya cobrada si se cancela un pedido
  (se avisa explícitamente en la confirmación de cancelación).

## Eventos emitidos
`order:created`, `order:delivered`, `order:cancelled`.

## Próximos pasos (roadmap)
- Pagos parciales / cuotas.
- Reversión automática de la seña al cancelar (requiere decidir cómo
  modelar un movimiento de caja "negativo" sin romper el arqueo).
- Vista de calendario de entregas próximas.
