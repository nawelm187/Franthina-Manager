# Identidad de marca Franthina

Extraída directamente del flyer oficial de la marca (Feria Salamanca, 4 de
julio). Cualquier cambio de diseño futuro debería mantenerse consistente
con esto — es la fuente de verdad visual, no una interpretación.

## Paleta de colores

| Token | Valor | Uso en el flyer |
|---|---|---|
| `--color-cream` | `#FBEAE8` | Fondo general — blush cremoso |
| `--color-vanilla` | `#F7DCE0` | Superficies secundarias |
| `--color-beige` | `#EFC2CE` | Bordes, tarjetas — rosa suave (no marrón) |
| `--color-caramel` | `#E0568C` | Acento principal — el rosa vivo de "FERIA" y "4 DE JULIO" |
| `--color-chocolate` | `#7D2142` | Texto de marca — el bordó de "Salamanca" y el logotipo "Franthina" |
| `--color-coffee` | `#4A1228` | Texto de máximo contraste — vino casi negro |
| `--color-gold` | `#CB9A5F` | Acento secundario — dorado tostado del banderín |

Los colores semánticos (éxito/alerta/error/info) se mantienen en tonos
distintos a la paleta de marca a propósito, para que nunca se confunda un
estado del sistema con un acento decorativo.

## Tipografía

| Token | Fuente | Uso |
|---|---|---|
| `--font-script` | Mrs Saint Delafield | **Solo** el wordmark de marca (sidebar). Nunca en texto funcional. |
| `--font-display` | Fredoka | Títulos (h1–h4) — el tratamiento bold y redondeado de "FERIA" |
| `--font-body` | Nunito | Todo el resto: párrafos, botones, inputs, tablas |

### Por qué el script no se usa en toda la interfaz

El flyer usa caligrafía script para "Franthina" y "Salamanca" — pero ese
mismo tratamiento en botones, tablas o formularios rompería el requisito de
accesibilidad del proyecto (texto legible para personas con baja visión,
sin depender de un tipo de letra decorativo). La solución: el script queda
reservado exclusivamente al wordmark de marca, que aparece una sola vez por
pantalla y es puramente identitario, no funcional. Todo lo que el usuario
necesita leer para operar el sistema usa Fredoka o Nunito, ambas con muy
buena legibilidad a los tamaños grandes que ya exige `tokens.css`.

## Elementos visuales del flyer que NO se trasladaron (y por qué)

- **Banderines (bunting), corazones decorativos, ilustraciones acuareladas**:
  son elementos de una pieza de marketing puntual (un flyer para una feria),
  no de un sistema de diseño de software que se usa todos los días. Un ERP
  cargado de elementos decorativos iría en contra del principio de
  "simplicidad" del propio proyecto. La calidez de la marca se transmite acá
  a través de la paleta y la tipografía, no de ilustraciones.
- **Fondo a cuadros (gingham) del pie del flyer**: mismo motivo — es
  ambientación de pieza gráfica, no un patrón de fondo utilizable en una
  interfaz de trabajo sin volverse ruidoso.

## Ver también
- `design-system/tokens.css` — la implementación real de esta paleta.
- `docs/ARCHITECTURE.md` — convenciones generales del proyecto.
