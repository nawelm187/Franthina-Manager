# Módulo: Clientes

## Objetivo
Mantener los datos de contacto de los clientes de Franthina como base para
los futuros módulos de Ventas y Pedidos.

## Responsabilidades
- ✅ CRUD completo con validación (nombre obligatorio + al menos un dato de contacto).
- ✅ Búsqueda instantánea por nombre.
- ✅ Utilidad `isBirthdaySoon()` — lista para un futuro widget de Dashboard
  ("clientes que cumplen años esta semana"), no usada todavía en la interfaz.
- ❌ NO gestiona el historial de compras del cliente (pertenece a `sales`/`orders`,
  que referenciarán al cliente por `id`).

## Estructura
Mismo patrón que los módulos anteriores: model, validator, service, renderer,
controller, index.

## Eventos emitidos
`customer:created`, `customer:updated`, `customer:deleted`.

## Próximos pasos (roadmap)
- Historial de pedidos y compras del cliente (vista de solo lectura que
  consulte `orderService`/`salesService` cuando existan).
- Widget de cumpleaños próximos en el Dashboard.
- Etiquetas/segmentación de clientes (frecuente, mayorista, feria, etc.).
