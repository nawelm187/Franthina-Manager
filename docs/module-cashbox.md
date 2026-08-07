# Módulo: Caja

## Objetivo
Modelar la caja diaria como una máquina de estados simple: **cerrada → abierta
→ (movimientos) → arqueo → cerrada**, con un registro auditable de cada
ingreso y egreso.

## Responsabilidades
- ✅ Solo puede haber una sesión abierta a la vez (`open()` rechaza si ya hay una).
- ✅ Movimientos manuales (ingreso/egreso) y automáticos (`type: sale`,
  generados por el módulo Ventas).
- ✅ Arqueo al cierre: compara el efectivo contado contra lo esperado según
  apertura + movimientos, y calcula la diferencia (sobrante/faltante/exacto).
  El cierre **nunca exige que el monto contado coincida exactamente** —
  cualquier valor no negativo cierra la caja; la diferencia queda calculada
  y mostrada con color (rojo = faltante, verde = sobrante o exacto), tanto
  en el resumen del cierre como en el reporte de Caja.
- ❌ NO permite editar ni eliminar movimientos ya creados (append-only, igual
  que Inventario) ni reabrir una sesión cerrada.

## Cómo se conecta con Ventas
Expone `registerSaleMovement(amount, reason)` específicamente para que el
módulo Ventas registre el ingreso de cada venta. Si no hay caja abierta,
este método devuelve `null` sin lanzar error — **una venta nunca debe
bloquearse por no tener la caja abierta** (ver `docs/module-sales.md`).

## Eventos emitidos
`cashbox:opened`, `cashbox:closed`, `cashbox:movement-created`.

## Próximos pasos (roadmap)
- Historial de sesiones cerradas con su resumen (hoy solo se ve el resumen
  inmediatamente después de cerrar).
- Reporte imprimible del arqueo.
- Múltiples cajas/turnos en el mismo día (actualmente es una sesión por vez).
