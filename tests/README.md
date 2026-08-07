# Tests

## `integration/`
`integration.test.mjs` ejecuta el código real de `core/` y `modules/` (no una
reimplementación) contra un DOM simulado con `jsdom`, encadenando todos los
módulos como lo haría un uso real de la aplicación: crea ingredientes, arma
una receta, planifica y completa una orden de producción, verifica que
Inventario reciba el movimiento correspondiente, crea un producto, un
cliente, abre caja, hace una venta, cierra caja con arqueo, exporta e importa
un backup completo, y finalmente verifica que el Dashboard agregue todos los
números correctamente.

### Cómo correrlo

```bash
cd tests
npm install
npm test
```

## `unit/` y `e2e/`
Todavía no existen. Se agregan el día que haya algo concreto que los
justifique: `unit/` para lógica aislada compleja que valga la pena probar
sin todo el resto del sistema alrededor, `e2e/` con un navegador real
(Playwright/Puppeteer) cuando un flujo de interfaz sea lo bastante crítico
como para justificar el costo de mantener ese tipo de test. Ver
`docs/ARCHITECTURE.md` para el razonamiento completo.

## Qué cubre `integration/`
- Cálculos: costo de receta, margen de producto, total de venta con
  descuento, monto esperado en caja.
- Reglas de negocio: operaciones todo-o-nada (producción y ventas no
  descuentan stock si falta), una sola caja abierta a la vez, no se puede
  cerrar una caja dos veces.
- Validaciones: rechazo de datos inválidos con `ValidationError`.
- Integración entre módulos: que Producción efectivamente escriba en
  Inventario, que Ventas efectivamente escriba en Caja, que el Dashboard
  agregue correctamente los datos de los módulos restantes.
- Backup: que exportar y luego restaurar reproduzca los mismos datos.

## Qué NO cubre (todavía)
Esto es un test de la capa de `Service` (lógica de negocio), no de la
interfaz. No abre modales, no simula clics ni tipeo — para eso haría falta
un navegador real. La revisión de la interfaz se hace hoy sirviendo el
proyecto localmente y probándolo a mano.

