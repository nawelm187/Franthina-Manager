# Módulo: Dashboard

## Objetivo
Dar una vista general del negocio en una sola pantalla.

## Cómo obtiene los datos
`dashboard.service.js` es el **único caso permitido** de un módulo consumiendo
directamente los `Service` públicos de otros módulos (`productService`,
`ingredientService`). Esto es intencional: el Dashboard es, por definición,
una vista agregada de todo el negocio. Nunca importa `renderer` ni
`controller` de otros módulos — solo su capa de `Service`.

Para datos que requieran reaccionar en tiempo real a cambios (por ejemplo,
"actualizar el contador de alertas apenas se crea un ingrediente con poco
stock"), el patrón correcto es suscribirse a `core/eventBus.js` en lugar de
hacer polling — ver `EVENTS.INGREDIENT_LOW_STOCK`.

## Próximos pasos (roadmap)
- Widgets reordenables (drag & drop) y personalización por usuario.
- Gráficos de ventas del día/mes (requiere módulo `sales`).
- Accesos rápidos configurables.
- Actividad reciente (requiere módulo transversal de auditoría/historial).
