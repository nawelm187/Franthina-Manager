# Módulo: Inventario

## Objetivo
Registrar cada movimiento de stock (entrada, salida, ajuste, merma) de forma
auditable, y mantener sincronizado el stock del ingrediente correspondiente.

## Decisión de diseño: stock editable + historial, no derivado (todavía)
Se evaluaron dos arquitecturas:

1. **Stock derivado**: el campo `stock` desaparece de Ingredientes y se
   calcula siempre sumando su historial de movimientos.
2. **Stock editable + historial auditable** (la elegida para este incremento):
   Ingredientes conserva su campo `stock`; Inventario lo actualiza a través de
   `ingredientService.update()` cada vez que registra un movimiento.

Se eligió la opción 2 porque el módulo `products`/`ingredients` ya está en uso
y migrar a stock derivado ahora es prematuro sin tener aún Producción ni
Compras integrados (que son los que más volumen de movimientos generarán).
La opción 1 queda planificada para cuando se construya `production`, momento
en el que sí se justifica el costo de esa migración.

**Importante:** Inventario nunca escribe en `storage` de Ingredientes
directamente — siempre pasa por `ingredientService.update()`, por lo que el
día que se migre a stock derivado, el cambio queda contenido en
`ingredient.service.js` y `inventory.service.js`, sin tocar la interfaz ni
otros módulos.

## Responsabilidades
- ✅ Registrar movimientos con tipo, cantidad y motivo.
- ✅ Actualizar el stock del ingrediente automáticamente y de forma consistente.
- ✅ Un movimiento de salida (`out`/`waste`) por más cantidad de la
  disponible se rechaza con `InsufficientStockError` — antes se aceptaba
  en silencio y el stock quedaba clampeado en 0 sin avisar.
- ✅ Historial completo, ordenado por fecha descendente.
- ❌ NO permite editar ni eliminar un movimiento ya creado (por diseño: un
  historial auditable debe ser append-only; una corrección se hace con un
  nuevo movimiento de ajuste, nunca reescribiendo el pasado).

## Eventos emitidos
`inventory:movement-created`.

## Próximos pasos (roadmap)
- Filtrar historial por ingrediente, tipo o rango de fechas.
- Vencimientos y lotes.
- Migración a stock derivado cuando se construya `production`.
