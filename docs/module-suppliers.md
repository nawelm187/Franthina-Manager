# Módulo: Proveedores

## Objetivo
Datos de contacto y tiempo de entrega de los proveedores, como base para el
módulo Compras.

## Responsabilidades
- ✅ CRUD completo, mismo patrón que Clientes.
- ❌ NO gestiona el historial de compras a cada proveedor (eso se consulta
  desde `purchaseService`, filtrando por `supplierId` — no se duplica en
  Proveedores).

## Eventos emitidos
`supplier:created`, `supplier:updated`, `supplier:deleted`.
