# PRODUCT.md — ALVINA (NPCart)

## Qué es

Catálogo web de miniaturas impresas en 3D hechas a pedido, con carrito y
confirmación de pedido por WhatsApp. El emprendimiento y nombre visible del
sitio es **Alvina 3D**; **NPCart** queda como nombre clave del proyecto
(repositorio, paquetes, infraestructura).

## Quién compra

Jugadores de mesa (D&D y afines), coleccionistas y compradores de regalo en
Perú. Llegan por WhatsApp, redes y clientes recurrentes; la web no se indexa
en buscadores a propósito (contenido con posible IP de terceros).

## Qué se vende

- Minis por **tamaño** (categoría: pequeña 2–3 cm, mediana 3–4 cm, grande
  4–5 cm) — eje de precio y de ofertas por cantidad.
- Temáticas (**series** N:M con una principal) — eje de descubrimiento:
  Marvel, Spiderman, D&D, Terror, Anime, etc.
- Servicios del emprendimiento: minis, pintado a mano, personalizados y
  merchandising.

## Cómo se compra

Sin cuentas. Carrito local (Zustand + localStorage versionado) → `POST
/api/orders` crea un snapshot verificable con código `NPC-XXXX` → link
`wa.me` con el mensaje → el vendedor confirma en el panel y se descuenta
stock. Moneda PEN (S/), locale `es-PE`.

## Superficies

| Superficie | Modo | Rol |
|---|---|---|
| Home | Persuade | Mostrar el mundo de la marca y llevar al catálogo |
| Catálogo / detalle / series | Operate | Encontrar la mini y agregarla |
| Carrito (drawer) | Operate | Ver ofertas por cantidad y enviar el pedido |
| Panel admin | Operate | CRUD del catálogo, ofertas y pedidos |

## Límites técnicos que el diseño debe respetar

- Sin checkout ni cuentas de cliente; el pedido vive en WhatsApp.
- Stock siempre finito; agotado no se agrega al carrito.
- Imágenes por URL pública de Google Drive (resolver aislado).
- Anti-indexación: `robots.txt`, `noindex`, `X-Robots-Tag`.
- Mobile-first real: la mayoría del tráfico abre desde el celular.

## Voz

Cercana y creativa, de taller artesanal con tecnología: clara, sin jerga
técnica, sin promesas de entrega que dependan de la conversación.
