# Métricas de tests por versión

No es una herramienta de cobertura (no se instrumenta el código para medir
qué líneas se ejecutan — eso sería más infraestructura, y el criterio de
este proyecto en esta etapa es "menos infraestructura, más experiencia de
uso"). Es un registro simple, sacado directamente del changelog de cada
versión, para poder responder objetivamente "¿esta versión mejoró o
empeoró?" sin tener que releer todo el historial.

Cómo se actualiza: después de correr `npm test` en `tests/`, el resumen
final ya imprime el tiempo de ejecución — se copia acá junto con el
resultado. Es manual a propósito: automatizarlo requeriría CI, que hoy este
proyecto no tiene (ni le hace falta con un solo desarrollador).

| Versión | Verificaciones | Módulos de negocio cubiertos | Errores encontrados en esa ronda | Tiempo de ejecución |
|---|---|---|---|---|
| v0.5.1 | 40 | 5 (Dashboard, Productos, Ingredientes, Recetas, Producción) | 0 (primera prueba general) | — |
| v0.6.0 | 50 | 7 (+ Clientes, Ventas) | 2 (bug de prefijo en logger.js, bug de acceso directo a localStorage en state.js) | — |
| v0.7.0 | 58 | 7 | 0 (ronda de refactor, sin bugs nuevos) | — |
| v0.8.0 | 70 | 10 (+ Pedidos, Proveedores, Compras) | 1 (order.service.js no forzaba status inicial) | — |
| v0.9.0 | 78 | 11 (+ Reportes) | 0 | — |
| v0.10.0 | 81 | 11 | 0 (vínculo Producto↔Receta, sin bugs) | — |
| v0.11.0 | 85 | 11 | 0 (guardas de integridad referencial) | — |
| v0.12.0 | 93 | 11 | 1 (Producción no sumaba stock al Producto — el más importante encontrado hasta ahora) | — |
| v0.13.0 | 99 | 11 | 0 (rediseño de Ventas) | — |
| v0.14.0 | 119 | 11 + verificador de integridad transversal | 0 (todos los hallazgos de esa ronda eran gaps de UX, no bugs de cálculo) | — |
| v0.15.0 | 129 | 11 + conversión de unidades | 0 | 135ms |

## Qué mirar versión a versión

- **Verificaciones**: debería crecer con cada versión que agrega
  funcionalidad. Si una versión agrega un módulo y el número no sube, es
  señal de que ese módulo quedó sin probar.
- **Errores encontrados**: no es malo que este número sea >0 — es señal de
  que la ronda de revisión sirvió para algo. Lo que sí sería mala señal es
  el mismo tipo de error repitiéndose en versiones distintas (regresión).
- **Tiempo de ejecución**: sigue siendo milisegundos con 129 verificaciones
  — a este ritmo de crecimiento no hace falta preocuparse por la velocidad
  del test suite todavía. Vale la pena revisarlo si algún día supera varios
  segundos, porque ahí empieza a desalentar correrlo seguido.

## Por qué no hay columna de "cobertura"

Medir cobertura de verdad requiere instrumentar el código (herramientas
como `c8` o `istanbul`), lo que agrega una dependencia de desarrollo y un
paso más al flujo de trabajo. Dado que el objetivo de esta etapa del
proyecto es priorizar experiencia de uso por sobre infraestructura (ver
`docs/ROADMAP.md`), la señal que sí se seguimos de cerca es más simple:
¿cada módulo tiene al menos una prueba de sus reglas de negocio principales
en `tests/integration/integration.test.mjs`? Eso ya se puede confirmar
leyendo las secciones del archivo, sin herramientas adicionales.
