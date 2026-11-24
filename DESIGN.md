# DESIGN.md — ALVINA (NPCart)

Sistema visual de la tienda. Fuente de verdad: `frontend/src/index.css`
(bloques `@theme` y `.dark`) — este documento lo explica, no lo reemplaza.

## Identidad

Marca de impresión 3D con personalidad de taller: un gato negro, una
impresora y una pieza turquesa. Núcleo cromático: **azul marino + turquesa +
blanco**; **violeta (#70205E)** como secundario expresivo para ofertas,
campañas y superficies con degradado. Negro solo como apoyo del dibujo (no es
un color de superficie).

## Paleta (tokens Tailwind)

### Tokens de marca (fijos en día y noche)

| Token            | Valor     | Uso                                                                        |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| `brand`          | `#001b46` | Superficies de marca que deben seguir oscuras (sidebar admin, chips fijos) |
| `brand-deep`     | `#00112e` | Fondo de portadas de serie, gradientes                                     |
| `brand-mid`      | `#0a2a5c` | Estados intermedios, gradientes                                            |
| `brand-ink`      | `#f6f8fb` | Texto sobre superficies `brand` / expresivas                               |
| `violet-brand`   | `#70205e` | Extremo violeta de los degradados expresivos y badge de oferta             |
| `turquoise`      | `#00d8dc` | Acento: rellenos, barras, badges, CTA de acento                            |
| `turquoise-deep` | `#00aeb3` | Hover de rellenos turquesa                                                 |

### Tokens semánticos (cambian con el tema)

| Token           | Día                     | Noche                | Uso                                                                |
| --------------- | ----------------------- | -------------------- | ------------------------------------------------------------------ |
| `navy`          | `#001b46`               | `#eef4fc`            | Texto principal; también relleno de botones/chips que se invierten |
| `navy-deep`     | `#00112e`               | `#dce8f8`            | Estados de hover invertidos                                        |
| `navy-mid`      | `#0a2a5c`               | `#c6daf2`            | Estados intermedios                                                |
| `mist`          | `#f6f8fb`               | `#061126`            | Fondo de página                                                    |
| `haze`          | `#e9eef7`               | `#0c1e3b`            | Superficies secundarias, skeletons                                 |
| `surface`       | `rgba(255,255,255,.66)` | `rgba(12,30,59,.72)` | Cards, inputs, tablas, listas                                      |
| `turquoise-ink` | `#00727a`               | `#5ce8eb`            | **Texto** turquesa legible                                         |
| `violet`        | `#70205e`               | `#f090dd`            | Texto de ofertas, promos, errores, eyebrows                        |

### Fondos expresivos

- `.bg-expressive`: degradado `#001b46 → #241a55 → #70205e` (135°). Usar en
  hero, footer público, bloque de pasos y sidebar admin, siempre con
  `text-brand-ink`.
- `.bg-expressive-card`: variante para tarjetas de oferta, con `text-brand-ink`
  y acentos `turquoise`.

### Modo noche

- Se activa con la clase `.dark` en `<html>`; el script inline de
  `index.html` la aplica antes del primer pintado.
- Preferencia: sigue `prefers-color-scheme` hasta que el usuario pulse el
  `ThemeToggle` (Sol/Luna); la elección se guarda en `localStorage`
  (`npcart.theme`).
- No hace falta duplicar clases: los tokens semánticos se invierten y los
  componentes heredan el tema.

### Reglas de contraste (no negociables)

- Turquesa **nunca** es color de texto sobre fondo claro → usar `turquoise-ink`.
- Texto sobre relleno turquesa = `brand` (≈11:1), jamás blanco ni `mist`.
- Texto sobre navy, violeta o superficies expresivas = `brand-ink`/blanco
  (≥10:1). En superficies expresivas no usar `text-navy` (no se invierte).
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

`.btn-primary` (navy, se invierte en modo noche), `.btn-accent` (turquesa +
texto `brand`), `.btn-ghost` (superficie clara/oscura), `.btn-ghost-light`
(sobre superficies de marca), `.input`, `.label`, `.card` (token `surface`),
`.chip`/`.chip-active`, `.eyebrow` (violeta) y `.eyebrow-light` (turquesa,
sobre superficies de marca).

`ThemeToggle` (`components/ThemeToggle.tsx`) alterna día/noche en tienda y
admin; usa `useThemeStore` para mantenerse sincronizado entre instancias.

## Movimiento

Transiciones cortas (150–300 ms) para hover, drawer y estados del carrito.
Sin entradas animadas por sección. Respetar `prefers-reduced-motion`.

## Anti-patrones de esta marca

- Volver a fondos crema cálidos o acentos terracota (look genérico de IA).
- Usar turquesa como texto sobre claro o blanco sobre turquesa.
- Introducir colores fuera de la paleta (rojos, verdes de sistema).
- Romper `.container-page` o usar full-bleed fuera del hero.
- Usar `text-navy` sobre `.bg-expressive`/`.bg-expressive-card` o superficies
  `brand`: en modo noche esas superficies no se invierten.
- Añadir `dark:` por componente cuando basta con un token semántico.
