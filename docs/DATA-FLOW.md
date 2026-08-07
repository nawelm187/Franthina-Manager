# Cómo viajan los datos

No es un diagrama abstracto — es el recorrido real de una acción concreta,
con nombres de archivo y línea, para que se pueda seguir en el código.

## Ejemplo trazado: crear una venta

```
1. UI (modal abierto por sale.controller.js)
   El usuario completa el carrito y toca "Confirmar venta".

2. Controller — modules/sales/sale.controller.js
   readSaleForm() arma el objeto payload desde el <form>.
   Llama a saleService.create(payload).

3. Validator — modules/sales/sale.validator.js
   validateSale() revisa la forma de los datos (validators.js compartidos).
   Si falla, lanza ValidationError — el Controller la atrapa y pinta
   los errores en el formulario, sin llegar a Storage.

4. Service — modules/sales/sale.service.js
   - Verifica stock disponible (checkAvailability, consulta productService).
   - Si falta stock: lanza InsufficientStockError, no escribe nada.
   - Si hay stock: runAtomic() descuenta el stock de cada producto
     (vía productService.update — nunca toca storage de Productos directo).
   - storage.create('sales', {...}) guarda la venta.
   - cashboxService.registerAutoMovement() refleja el ingreso en Caja,
     si hay una sesión abierta (llamada directa, no evento — ver más abajo).
   - eventBus.emit(EVENTS.SALE_CREATED, sale) — para quien quiera escuchar
     en el futuro (hoy nadie lo hace, ver docs/EVENTS.md).

5. Storage — core/storage/index.js → LocalStorageAdapter
   Persiste en localStorage bajo la clave con prefijo de la app.

6. Controller vuelve a llamar a render()
   Trae la lista actualizada (storage → Service → Controller) y se la pasa
   al Renderer.

7. Renderer — modules/sales/sale.renderer.js
   Genera el HTML de la tabla actualizada. Nunca toca storage ni contiene
   lógica de negocio — solo recibe datos ya calculados y los pinta.
```

## Regla general (la que sigue todo módulo)

```
UI (click/submit)
  → Controller (orquesta, nunca contiene reglas de negocio)
    → Validator (revisa forma de los datos, nunca decide qué hacer con ellos)
    → Service (reglas de negocio, la única capa que llama a Storage
               y a los Services públicos de otros módulos)
      → Storage (persistencia, nunca sabe qué es una "venta" o un "producto")
    ← Service devuelve el resultado
  → Controller le pide al Renderer que pinte
    → Renderer (solo genera HTML a partir de datos ya resueltos)
```

## Por qué algunas conexiones son llamada directa y otras son evento

Dos patrones conviven a propósito, no por inconsistencia:

- **Llamada directa a un Service público de otro módulo** (ej. Ventas llama
  a `cashboxService.registerAutoMovement()`): se usa cuando el resultado
  tiene que estar garantizado *antes* de que la operación original termine
  — por ejemplo, para que `runAtomic()` pueda revertir todo junto si algo
  falla después. Ver `docs/ARCHITECTURE.md`, sección de `atomicRun`.
- **Evento por el `eventBus`** (ej. `EVENTS.SALE_CREATED`): se usa para todo
  lo que un módulo futuro podría querer saber sin que el emisor tenga que
  conocerlo. Hoy la mayoría de los eventos de dominio no tienen un listener
  todavía — se emiten igual, documentados en `docs/EVENTS.md`, listos para
  cuando aparezca ese módulo futuro (por ejemplo, un centro de
  notificaciones o el historial/auditoría del ROADMAP).

## Ver también
- `docs/STORAGE.md` — qué guarda cada colección.
- `docs/EVENTS.md` — catálogo completo de eventos.
- `docs/ARCHITECTURE.md` — convenciones y decisiones de fondo.
