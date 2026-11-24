# DESIGN.md — ALVINA (NPCart)

Sistema visual de la tienda. Fuente de verdad: `frontend/src/index.css`
(bloque `@theme`) — este documento lo explica, no lo reemplaza.

## Identidad

Marca de impresión 3D con personalidad de taller: un gato negro, una
impresora y una pieza turquesa. Núcleo cromático: **azul marino + turquesa +
blanco**; **violeta** como secundario para ofertas y campañas. Negro solo
como apoyo del dibujo (no es un color de superficie).

## Paleta (tokens Tailwind)

| Token | Valor | Uso |
|---|---|---|
| `navy` | `#001b46` | Texto principal, botones primarios, superficies oscuras (hero, pasos, footer del flujo) |
| `navy-deep` | `#00112e` | Hover de superficies navy, sidebar admin |
| `navy-mid` | `#0a2a5c` | Estados intermedios, gradientes |
| `mist` | `#f6f8fb` | Fondo de compra (blanco frío) |
| `haze` | `#e9eef7` | Superficies secundarias, skeletons |
| `turquoise` | `#00d8dc` | Acento: rellenos, barras, badges, CTA de acento |
| `turquoise-deep` | `#00aeb3` | Hover de rellenos turquesa |
| `turquoise-ink` | `#00727a` | **Texto** turquesa sobre fondos claros (AA ~5.7:1) |
| `violet` | `#70205e` | Ofertas, promos, errores de formulario, eyebrows |

### Reglas de contraste (no negociables)

- Turquesa **nunca** es color de texto sobre fondo claro → usar `turquoise-ink`.
- Texto sobre relleno turquesa = `navy` (≈11:1), jamás blanco (≈1.5:1).
- Texto sobre navy o violeta = `mist`/blanco (≥10:1).
- Acentos decorativos (punto de marca, cifras sobre navy) pueden ser
  `turquoise` puro porque no cargan información.

## Tipografía

- **Display: Anton** (condensada, pesada, solo peso 400). La clase
  `font-display` aplica mayúsculas + tracking sutil, eco del lettering del
  logo. No usar `font-bold`/`font-semibold` con ella (bold sintético).
- **Cuerpo: Inter** 400–700, sentence case.
- Escala: hero `text-6xl`, títulos de sección `text-2xl/3xl`, cuerpo `text-sm/base`,
  metadatos `text-[11px]/xs` con tracking.

## Layout

- Contenedor único: `.container-page` (`max-w-6xl`, `px-4 sm:px-6 lg:px-8`,
  centrado). Todo el contenido de página vive dentro; nunca full-bleed.
- Home: hero navy full-bleed (identidad) + secciones claras en contenedor.
- Grid de producto responsive 2→3→4 columnas; imagen en ratio 4/5.

## Componentes base (`index.css`)

`.btn-primary` (navy), `.btn-accent` (turquesa + texto navy),
`.btn-ghost` (claro), `.btn-ghost-light` (sobre navy), `.input`, `.label`,
`.card`, `.chip`/`.chip-active`, `.eyebrow` (violeta) y `.eyebrow-light`
(turquesa, sobre navy).

## Movimiento

Transiciones cortas (150–300 ms) para hover, drawer y estados del carrito.
Sin entradas animadas por sección. Respetar `prefers-reduced-motion`.

## Anti-patrones de esta marca

- Volver a fondos crema cálidos o acentos terracota (look genérico de IA).
- Usar turquesa como texto sobre claro o blanco sobre turquesa.
- Introducir colores fuera de la paleta (rojos, verdes de sistema).
- Romper `.container-page` o usar full-bleed fuera del hero.
