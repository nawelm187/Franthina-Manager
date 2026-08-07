# Arquitectura: convenciones y decisiones de fondo

Este documento existe para que las reglas de abajo nunca se discutan de
nuevo por accidente ni se rompan sin querer a medida que el proyecto crece.

## Convención de nombres (regla fija)

Cada módulo de negocio vive en `modules/<nombre-plural>/` y sus archivos usan
el **singular** del dominio como prefijo:

| Carpeta | Prefijo de archivo | Ejemplo |
|---|---|---|
| `products/` | `product.*` | `product.service.js` |
| `ingredients/` | `ingredient.*` | `ingredient.model.js` |
| `recipes/` | `recipe.*` | `recipe.controller.js` |
| `inventory/` | `inventory.*` (no tiene forma singular natural) | `inventory.service.js` |
| `production/` | `production.*` (ídem) | `production.model.js` |
| `customers/` | `customer.*` | `customer.validator.js` |
| `sales/` | `sale.*` | `sale.renderer.js` |
| `cashbox/` | `cashbox.*` (ídem) | `cashbox.controller.js` |
| `orders/` | `order.*` | `order.service.js` |
| `suppliers/` | `supplier.*` | `supplier.model.js` |
| `purchases/` | `purchase.*` | `purchase.controller.js` |

Dentro de cada módulo, el sufijo indica la capa — ver la tabla de
responsabilidades en `README.md`. Todo módulo nuevo sigue esta misma regla
sin excepción.

## Claves de storage (regla fija)

Ningún archivo escribe el nombre de una colección, ni una clave de valor
suelto, como string literal. Todo vive en `core/constants/storageKeys.js`:
`COLLECTIONS` (colecciones con registros e `id`) y `META_KEYS` (valores
sueltos vía `storage.getMeta`/`setMeta`, como la versión de esquema o las
preferencias de accesibilidad). Cada `*.model.js` re-exporta su constante de
colección desde ahí. Esto es lo que le permite a `core/backup.js`
exportar/importar todos los datos de la app sin tener que conocer cada
módulo de negocio uno por uno.

Nota de diseño: `ROUTES` (en `core/config.js`) y `EVENTS` (en
`core/eventBus.js`) están centralizados también, pero deliberadamente NO
viven en `storageKeys.js` — no son claves de storage, son catálogos de otra
naturaleza (rutas de navegación, nombres de evento) y cada uno vive junto a
la pieza que lo implementa. Centralizar no significa "todo en un solo
archivo": significa "una sola fuente de verdad por concepto".

## Qué capa de "cimientos" ya está resuelta

Antes de sumar más módulos de negocio, esto es lo que ya existe y por qué
alcanza para lo que el proyecto necesita hoy:

| Pieza | Dónde vive | Estado |
|---|---|---|
| Estado global de la app | `core/state.js` | ✅ Resuelto (preferencias de UI, ruta actual) |
| Comunicación entre módulos | `core/eventBus.js` | ✅ Resuelto, con catálogo único de eventos |
| Persistencia | `core/storage/` | ✅ Resuelto, con adaptador intercambiable |
| Sistema de rutas | `core/router.js` | ✅ Resuelto, con lazy loading |
| Manejo de errores y logs | `core/errors.js`, `core/logger.js` | ✅ Resuelto |
| Conversión de unidades | `core/units.js` | ✅ Resuelto (masa g/kg, volumen ml/l — diseño extensible por dimensión, ver el archivo) |
| Versionado de esquema / migraciones | `core/storage/migrations.js` | ✅ Resuelto (runner funcional, catálogo vacío hasta que haga falta la primera migración real) |
| Backup, exportación e importación | `core/backup.js` | ✅ Resuelto (exporta/restaura todas las colecciones como un JSON) |
| Sistema de configuración | `modules/settings/` | 🟡 Parcial: cubre accesibilidad y backup; moneda/impuestos quedan para cuando haya un módulo que los necesite |
| Undo/redo | — | ❌ No implementado. Es una decisión de UX cara (requiere que cada Service exponga su inverso) — se evalúa cuando un módulo concreto lo necesite, no de forma transversal especulativa |
| Permisos y roles | — | ❌ No implementado. Hoy la app asume un único usuario administrador; roles reales no tienen sentido hasta que exista autenticación (fase SaaS/multiusuario del ROADMAP) |
| Sincronización offline/online con backend | — | ❌ No implementado. El Service Worker ya cachea para uso offline; sincronizar cambios con un servidor remoto solo tiene sentido cuando exista ese servidor (`RestApiAdapter`, fase SaaS del ROADMAP) |

## Por qué no hay carpetas vacías para módulos futuros

`modules/settings/`, `reports/`, `analytics/`, `notifications/`, `users/`,
`suppliers/`, `purchases/`, `accounting/`, ni `core/permissions/`,
`middleware/`, `api/`, `hooks/`, ni una carpeta `i18n/` — se documentan en
`docs/ROADMAP.md` con su diseño pensado, pero no se crean como directorios
vacíos. Es la misma regla YAGNI que ya rige el resto del proyecto: una
carpeta sin código adentro no aporta nada hoy, y adivinar su forma final
antes de tener el primer caso de uso real suele significar rehacerla
después. Se crean cuando hay un módulo real para poner adentro.

## Validaciones compartidas

`core/validators.js` tiene las primitivas puras (`isNonEmptyString`,
`isPositiveNumber`, `isNonNegativeNumber`, `isValidEmail`,
`isValidDateString`, `isOneOf`) que usa cada `*.validator.js` de cada módulo.
Estas primitivas nunca lanzan excepciones ni conocen el concepto de "campo"
— eso sigue siendo responsabilidad de cada validador de dominio, que arma su
propio diccionario de `fieldErrors` y lo empaqueta en un único
`ValidationError`. La regla se mantiene: toda validación vive en
`*.validator.js`, nunca en el formulario del renderer.

## Errores tipados

Todos los errores de dominio (`ValidationError`, `NotFoundError`,
`InsufficientStockError`) extienden `AppError` (`core/errors.js`), que fija
`this.name` automáticamente al nombre de la subclase. Esto evita que una
subclase nueva se olvide de setear `name` manualmente y quede sin traducción
amigable en `handleError()`.

## Operaciones "todo o nada": por qué no hay un `storage.transaction()` genérico

Producción (al completar una orden) y Ventas (al confirmar una venta) son
las únicas dos operaciones de todo el proyecto que escriben en más de un
registro como una sola unidad lógica. Ambas ya verifican factibilidad antes
de escribir nada, así que una falla a mitad de la escritura es un caso raro
pero no imposible. En vez de construir una API de transacciones genérica
sobre `localStorage` (que no puede ofrecer aislamiento real y sería una
promesa a medias), `core/storage/atomicRun.js` resuelve el caso concreto:
ejecuta una lista de pasos, y si alguno falla, deshace (best-effort) los
que ya se aplicaron, en orden inverso, dejando rastro en el logger si el
propio rollback falla. Es deliberadamente chico y está atado a los dos
lugares reales que lo necesitan hoy — no es una capa de infraestructura
especulativa.

## Versionado de migraciones: número entero secuencial, no SemVer

`core/storage/migrations.js` versiona el esquema con un entero simple
(1, 2, 3...) en vez de SemVer (`major.minor.patch`). Es la misma convención
que usan Rails, Django y Flyway para migraciones de base de datos: SemVer
comunica compatibilidad entre paquetes publicados que otros consumen: eso no
aplica acá, porque nadie importa "el esquema de datos de Franthina Manager"
como dependencia externa. Cada migración ya deja explícito, en su propio
`description`, desde qué versión y hacia qué versión transforma los datos —
que es la información que un SemVer real agregaría, sin la complejidad de
decidir qué constituye un cambio "mayor" vs "menor" en un esquema interno.

## Guardas de integridad referencial: Controller, no Service

Cuando una entidad no debe poder borrarse si otra la está usando (ej.: no
borrar una receta que un producto tiene vinculada, no borrar un ingrediente
que una receta usa), la guarda vive en el **Controller** que dispara el
borrado, nunca en el `Service` de la entidad que se borra.

Por qué: la dirección de estas guardas es la inversa de la dirección de
lectura de datos ya establecida. `products -> recipes` (Productos lee
Recetas para sincronizar costo) y `recipes -> ingredients` (Recetas lee
Ingredientes para calcular costo) ya son dependencias de `Service`
legítimas. Si `recipeService.remove()` necesitara preguntarle a Productos
"¿alguien me usa?", sería `recipes -> products`, que combinado con
`products -> recipes` ya existente forma un ciclo real a nivel de Service.

La solución: la capa de `Service` mantiene la regla dura de "debe ser un
grafo acíclico" (verificado automáticamente en cada revisión, separando
archivos `*.service.js`/`*.model.js`/`*.validator.js` de
`*.controller.js`/`*.renderer.js`). La capa de `Controller` puede leer
Services de otros módulos con más libertad — mismo patrón que ya usaban
`order.controller.js` y `sale.controller.js` para leer `customerService` —
porque es una lectura de UI, no una dependencia de lógica de negocio.

Ejemplos concretos: `recipe.controller.js` lee `productService.list()` antes
de permitir borrar una receta; `ingredient.controller.js` lee
`recipeService.list()` antes de permitir borrar un ingrediente. Ninguno de
los dos `Service` correspondientes conoce al otro módulo.

## Detección de duplicados: mismo patrón, mismo lugar

La detección de nombres duplicados (Ingredientes, Productos — "Harina" y
"harina" no deberían ser dos registros distintos) sigue exactamente el mismo
criterio que las guardas de integridad referencial: vive en el `Controller`
(`findDuplicateIngredientName()`, `findDuplicateProductName()`), no en el
`Service`. El `Service` nunca bloquea duplicados — es una decisión de UX
(evitar que el usuario cargue sin querer el mismo ingrediente dos veces),
no una regla de integridad de datos que deba cumplirse pase lo que pase.
Comparación insensible a mayúsculas y acentos vía `normalizeForSearch()`
(`core/utils.js`), la misma función que usa la búsqueda de Productos y
Clientes.

## Verificación de integridad de datos

`reportService.checkIntegrity()` (pestaña "🩺 Integridad" en Reportes) es la
red de seguridad para el caso en que, pese a las guardas anteriores, algo
quede inconsistente igual — por ejemplo, un dato modificado directamente
sobre el `Service` sin pasar por el `Controller` (las guardas de integridad
referencial no protegen ese camino, por diseño — ver más arriba), o un
backup importado desde otra instalación que traía datos rotos. Es de solo
lectura: nunca corrige nada automáticamente, solo informa con severidad
(`error`/`warning`/`info`) para que la persona decida qué hacer.

## El Renderer nunca importa el Service (regla dura, con dos violaciones reales encontradas)

`*.renderer.js` genera HTML a partir de datos que el Controller le pasa ya
resueltos — nunca llama a `storage`, y tampoco debería llamar al `Service`
de su propio módulo, ni para leer datos derivados. Esto no es solo una
preferencia estética: si el Renderer puede llamar al Service directamente,
dos módulos pueden terminar recalculando el mismo valor derivado en
momentos distintos con resultados inconsistentes (ver el bug real de abajo).

Se encontraron y corrigieron dos violaciones reales durante la ronda de UX
de ordenamiento de tablas:
- `product.renderer.js` calculaba `marginPct` (el margen de un producto)
  llamando a `productService.margin()` **dentro del propio renderer**,
  después de que el Controller ya había ordenado los productos por ese
  mismo campo — ordenar por "Margen" habría operado sobre datos crudos que
  todavía no tenían ese campo calculado, dando un orden sin sentido.
- `ingredient.renderer.js` llamaba a `ingredientService.isLowStock()` de la
  misma forma, para la columna "Estado".

La corrección en ambos casos fue la misma: el valor derivado (`marginPct`,
`lowStock`) se calcula en el **Controller**, antes de ordenar y antes de
pasarle las filas al Renderer — que ahora solo lee `row.marginPct` /
`row.lowStock` ya resueltos, sin conocer el Service en absoluto.

## Tests

`tests/integration/` contiene pruebas de integración que ejecutan el código
real de `core/` y `modules/` contra un DOM simulado. Todavía no hay
`tests/unit/` ni `tests/e2e/` — se agregan el día que haya algo concreto que
justifique cada uno (unitarios para lógica aislada compleja que lo necesite;
e2e con navegador real cuando el flujo de UI sea lo bastante crítico como
para justificar el costo de mantenimiento de esos tests).
