# Módulo: Reportes

## Objetivo
Agregar datos ya existentes (ventas, producción, inventario, caja, compras)
por rango de fechas, con exportación a CSV.

## Por qué no tiene model.js ni validator.js
Es la única excepción documentada al patrón de 6 archivos por módulo. No
existe una entidad "Reporte" que se cree, edite o valide — todo es
agregación de solo lectura calculada al vuelo sobre datos que ya viven en
otros módulos. Forzar un `model.js` vacío solo para seguir la forma sería
exactamente el tipo de ruido que este proyecto evita a propósito (ver
`docs/ARCHITECTURE.md`).

## Responsabilidades
- ✅ 6 reportes: Ventas, Producción, Inventario, Caja, Compras, e
  **Integridad** — cada uno agrega datos consultando el Service público
  del módulo correspondiente, nunca su storage directo.
- ✅ **Integridad de datos** (`checkIntegrity()`): recorre todos los módulos
  buscando referencias rotas, stock negativo, ids duplicados y datos
  incompletos. Es la red de seguridad para el caso residual en que algo
  quede inconsistente pese a las guardas de integridad referencial del
  Controller (ver `docs/ARCHITECTURE.md`) — por ejemplo, un dato tocado
  fuera de la UI, o un backup importado desde otra instalación.
- ✅ Exportación a CSV (JS puro, sin librerías — `core/csv.js`).
- ❌ NO exporta a PDF ni Excel todavía: ambos requieren una librería externa,
  y no se agrega una dependencia nueva sin una necesidad concreta que la
  justifique (misma regla YAGNI documentada en `docs/ARCHITECTURE.md`).
  CSV cubre el caso de uso real de "llevarme los datos a Excel" sin esa
  dependencia: cualquier planilla abre un CSV directamente.
- ❌ NO calcula "Ganancias" como reporte separado todavía (el brief original
  lo pide) — se puede derivar combinando Ventas (ingresos) y Compras
  (egresos) manualmente por ahora; un reporte de rentabilidad dedicado que
  cruce costo de receta vendida vs. precio de venta queda para cuando haya
  una necesidad concreta de verlo así.

## Eventos
Ninguno — es un módulo de solo lectura, no genera cambios de estado que
otros módulos necesiten conocer.

## Próximos pasos (roadmap)
- Reporte de rentabilidad real (ingresos de Ventas − costo de ingredientes
  consumidos según Producción).
- Exportación a PDF para reportes que se quieran imprimir o compartir.
- Gráficos (hoy son solo tablas y totales).
