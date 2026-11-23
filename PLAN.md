# NPCart — Plan de proyecto

Catálogo web de minis impresas en 3D con carrito, pedido persistido como snapshot verificable y confirmación por WhatsApp.

---

## 1. Decisiones cerradas

| Área | Decisión |
|---|---|
| Estructura | Monorepo con npm workspaces: `frontend/`, `backend/`, `packages/pricing` |
| Frontend | React + TypeScript + Vite + Tailwind CSS, clean architecture, TanStack Query |
| Backend | Node + TypeScript + Express + Prisma, clean architecture |
| Base de datos | PostgreSQL |
| Borrado | **Lógico** (`deletedAt`) en todas las tablas; nunca borrado físico |
| Autenticación | Solo admin (JWT); los clientes compran sin cuenta |
| Imágenes | URL pública de Google Drive, normalizada por un resolver aislado |
| Pedido | Snapshot persistido (`Order`) con código corto verificable + link `wa.me` prellenado |
| Dinero | **Céntimos enteros end-to-end** (BD, dominio, API, frontend); nunca `float` |
| Categoría | Tamaño de la mini — eje de precio, relación simple |
| Series | Temáticas N:M con una serie principal — eje de descubrimiento; mínimo 1 por producto |
| Ofertas | Por categoría, **múltiples tramos**: al llegar a N unidades, todas pasan a precio especial por unidad |
| Precio | Por producto, autocompletado desde `Category.basePrice` |
| Variantes | Sin variantes: cada tamaño es un producto separado |
| Extras admin | `isActive`, `isFeatured`, control de stock (siempre finito) |
| Moneda | PEN (S/), locale `es-PE`, teléfono WhatsApp +51 |
| Visibilidad | **No indexada**: `robots.txt`, `noindex`, `X-Robots-Tag`; el link se distribuye por WhatsApp |
| Despliegue | Railway (backend + Postgres) y Netlify (frontend) |

### Los dos ejes del catálogo

- **Categoría = tamaño.** Ejemplo: mini pequeña (2–3 cm), mini mediana (3–4 cm), mini grande (4–5 cm). Determina el precio y es el eje sobre el que se aplican las ofertas.
- **Serie = temática.** Ejemplo: Super Héroes, Marvel, Spiderman, Dungeons & Dragons, Terror. Es el eje de descubrimiento: es lo que el cliente busca emocionalmente.

Son ejes **independientes** que se cruzan ("mini mediana" + "Spiderman"). Un producto tiene **una** categoría y **varias** series.

---

## 2. Modelo de datos (Prisma)

```
Category       id, name, slug, basePriceCents(Int), sortOrder,
               createdAt, deletedAt
Series         id, name, slug, imageUrl?, sortOrder,
               createdAt, deletedAt
Product        id, name, categoryId, primarySeriesId, priceCents(Int),
               imageUrl, details(Text), stock(Int), isActive, isFeatured,
               createdAt, updatedAt, deletedAt
ProductSeries  productId, seriesId                       ← PK compuesta (N:M)
CategoryOffer  id, categoryId, minQuantity, unitPriceCents(Int), isActive,
               createdAt, deletedAt
               unique(categoryId, minQuantity) parcial: WHERE deletedAt IS NULL
Order          id, code (único, corto, ej. NPC-8F3K),
               status (PENDIENTE | CONFIRMADO | CANCELADO),
               subtotalCents, discountCents, totalCents,
               createdAt, confirmedAt
OrderItem      orderId, productId, name, categoryName, seriesName,
               unitPriceCents, qty, lineTotalCents     ← snapshot del pedido
AdminUser      id, email, passwordHash
```

Los slugs son únicos con **índice parcial** (`WHERE deletedAt IS NULL`): archivar libera el slug para reutilización. Se autogeneran desde el nombre y el admin puede editarlos.

### Reglas de negocio

**Dinero.** Todo precio vive y viaja como **céntimos enteros** (`1250` = S/ 12.50): columnas `Int` en Postgres, enteros en el dominio y en los DTOs de la API. `Prisma.Decimal` queda fuera del flujo. El formateo a S/ ocurre solo en presentación (`Intl.NumberFormat('es-PE')`).

**Ofertas por cantidad.** Se suman las unidades del carrito que pertenecen a una misma categoría, mezclando series libremente. Gana el tramo de mayor `minQuantity` alcanzado y **todas** las unidades de esa categoría pasan a costar `unitPrice`. Una categoría puede tener varios tramos activos (5+ = S/ 12, 10+ = S/ 10), sujetos a dos validaciones: unicidad `(categoryId, minQuantity)` y `unitPrice` **estrictamente decreciente** al subir `minQuantity` — un tramo nunca puede encarecer respecto al anterior. Frente al producto: si uno ya cuesta menos que `unitPrice`, conserva su precio; esas unidades **sí cuentan** para alcanzar el tramo, pero el ahorro se calcula solo sobre unidades efectivamente descontadas. Si el ahorro resultante es 0, la barra de progreso muestra "oferta completada" sin prometer descuento.

> Ejemplo: "Lleva 5 minis medianas, de la serie que sea, y pagas S/ 12 c/u."

**Serie principal.** `primarySeriesId` tiene **FK real en la BD** además de la validación de la entidad `Product` en el dominio: debe existir también en `ProductSeries`. Todo producto exige **mínimo 1 serie**. Al crear, la primera serie elegida se inserta en ambos sitios de forma atómica. Si el admin quita la serie principal de la lista, se promueve otra automáticamente. Archivar una serie que es principal de productos activos → **bloqueado** con mensaje "reasigna primero la serie principal en N productos".

**Precio base.** `Category.basePriceCents` solo autocompleta el formulario de admin. El precio real siempre se lee de `Product.priceCents`.

**Stock.** Siempre finito (`Int` NOT NULL), sin reservas. A 0 el producto se marca *Agotado*, no se puede agregar al carrito y se muestra atenuado **solo en el sort por defecto** (nunca pisando el orden elegido por el usuario). El carrito limita la cantidad al stock disponible y, al cargarse desde `localStorage`, se revalida contra la API. **Al marcar CONFIRMADO un pedido en el panel se descuenta stock; CANCELAR lo devuelve.** Si al confirmar el stock ya no alcanza (otro cliente llegó antes), se descuenta hasta agotar y el panel lo advierte.

**Borrado lógico.** `DELETE` en la API siempre archiva (`deletedAt`), nunca borra filas. Las consultas públicas excluyen archivados e inactivos; el panel admin los lista (con opción de restaurar). Archivar una **categoría con productos activos** o una **serie principal de productos activos** → bloqueado hasta reasignar.

**Pedido.** El carrito se calcula en el cliente para dar feedback instantáneo. Al enviar, `POST /api/orders`: el servidor valida contra el catálogo vigente, **excluye ítems agotados o desactivados y lo devuelve para avisar al cliente** ("2 ítems ya no están disponibles y se excluyeron"), recalcula totales autoritativos y persiste la Order PENDIENTE con su código. El mensaje de WhatsApp incluye el código; el vendedor verifica contra el panel. `OrderItem` guarda un snapshot (nombre, categoría, serie, precio unitario): el pedido no cambia aunque el catálogo cambie después.

---

## 3. Backend — estructura

```
backend/src/
  domain/
    entities/        Product, Category, Series, CategoryOffer, Order, OrderItem
    value-objects/   Money, Slug, Stock
    services/
    repositories/    IProductRepository, ICategoryRepository, ...
    errors/
  application/
    use-cases/
      product/       Create, Update, Archive, List(filtros), GetById,
                      ToggleActive, ToggleFeatured
      category/      CRUD + Archive
      series/        CRUD + Archive
      offer/         CRUD + Archive
      order/         CreateOrder, ListOrders, ConfirmOrder, CancelOrder
      auth/          LoginAdmin
    dto/
    ports/           IPasswordHasher, ITokenService, IImageUrlResolver
  infrastructure/
    database/prisma/ schema.prisma, client, repositorios concretos
    security/        BcryptHasher, JwtTokenService
    images/          GoogleDriveImageUrlResolver  ← punto único de cambio
    config/          env validado con zod
  presentation/
    http/
      routes/        product, category, series, offer, order, auth
      controllers/
      middlewares/   auth, validate(zod), errorHandler, rateLimit
      server.ts
```

> La regla de ofertas vive en **`packages/pricing`**, un paquete compartido importado por backend y frontend: una sola implementación y un solo set de tests. El drift es imposible por construcción.

### API pública

```
GET  /api/products?categories=&series=&q=&minPrice=&maxPrice=&inStock=&sort=&page=&pageSize=
GET  /api/products/featured     ← declarada ANTES de /:id
GET  /api/products/:id          ← :id validado como cuid
GET  /api/categories
GET  /api/series
GET  /api/offers
POST /api/orders                ← snapshot PENDIENTE + código (rate limit)
POST /api/auth/login
GET  /health
```

Paginación: `pageSize` máx 50; toda respuesta de listado incluye `total`. El endpoint público de productos **nunca** devuelve inactivos ni archivados, venga quien venga.

### API admin (`/api/admin/*`, protegida con JWT)

```
GET | POST | PUT | DELETE   /api/admin/products     (GET lista inactivos + archivados)
GET | POST | PUT | DELETE   /api/admin/categories
GET | POST | PUT | DELETE   /api/admin/series
GET | POST | PUT | DELETE   /api/admin/offers
GET                        /api/admin/orders        (con filtros por estado/fecha)
PUT   /api/admin/orders/:id/confirm
PUT   /api/admin/orders/:id/cancel
```

`DELETE` archiva (borrado lógico). RESTAURAR: `POST /api/admin/<recurso>/:id/restore`.

El listado de productos devuelve además los **conteos por faceta** (resultados por categoría y por serie) para los filtros, calculados con los demás filtros aplicados. Los conteos de series usan `distinct` por producto, para no contar dos veces una mini presente en varias series marcadas.

**Bootstrap del admin.** El seed idempotente crea el `AdminUser` desde `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`. Reset: cambiar la variable y redeployar, o correr `npm run create-admin` (script CLI documentado, usable vía `railway run` contra prod).

---

## 4. Frontend — estructura

```
frontend/src/
  domain/
    entities/        Product, Category, Series, CartItem, CategoryOffer
                     (la regla de precios se importa de @npcart/pricing)
  application/
    use-cases/       addToCart, updateQty, removeItem, clearCart,
                     createOrder, buildWhatsAppMessage, getOfferProgress,
                     filterProducts
    ports/           IProductGateway, IOrderGateway, ICartStorage
    store/           Zustand: cartStore, filterStore
  infrastructure/
    http/            axios client, ProductApiGateway, OrderApiGateway
    storage/         LocalStorageCartRepository  ← payload versionado
    images/          resolveImageUrl.ts         ← normaliza links de Drive
    whatsapp/        waLinkBuilder.ts
  presentation/
    pages/           Home, Catalog, SeriesPage, ProductDetail,
                     AdminLogin, AdminProducts, AdminCategories,
                     AdminSeries, AdminOffers, AdminOrders
    components/      ProductCard, ProductGrid, FilterPanel, SearchBar,
                     CartDrawer, OfferProgressBar, OfferBadge,
                     QuantityStepper, StockBadge, ImageWithFallback,
                     SeriesCarousel, EmptyState
    hooks/           useProducts, useCart, useOrders, useDebounce
    layouts/
```

### Experiencia de compra

- **Home.** Carrusel de series destacadas (lo que el cliente busca: *"quiero mis minis de D&D"*), grid de productos destacados y banner de ofertas vigentes por tamaño.
- **Catálogo.** Dos facetas paralelas multi-selección — *Tamaño* y *Serie* — más rango de precio, búsqueda con debounce y toggle "solo disponibles". Dentro de una faceta el filtro es OR; entre facetas es AND (*tamaño mediano* **Y** *(D&D o Terror)*). Filtros sincronizados con la URL para poder compartir. Grid responsive con skeletons y lazy loading.
- **Tarjeta de producto.** Imagen en ratio fijo, chips `Mini mediana` · `D&D` (serie principal), precio, badge de oferta y de stock. La lista completa de series aparece en el detalle.
- **Carrito (drawer lateral).** Agrupado por tamaño, con **barra de progreso de oferta** por categoría: *"Te faltan 2 minis medianas para que todas te queden a S/ 12 c/u"*, completables con cualquier serie. Muestra el ahorro total.
- **Envío del pedido.** Botón "Enviar por WhatsApp" → `POST /api/orders` → si el servidor excluyó ítems, aviso antes de abrir WhatsApp → link `wa.me` con mensaje y **código de pedido**.
- **Panel admin.** Tabla con filtros y paginación, toggles rápidos de activo y destacado, formulario con select de tamaño y **multi-select de series con chips** (la principal marcada con estrella y reasignable con un clic), precio autocompletado desde la categoría y campo de URL de imagen con **preview en vivo** para validar el link de Drive antes de guardar. Además, **página de pedidos**: buscar por código, ver el detalle del snapshot, confirmar (descuenta stock) o cancelar (lo devuelve).

---

## 5. Google Drive como storage de imágenes

El link que Drive entrega al compartir (`drive.google.com/file/d/<ID>/view`) **no es una imagen**, es una página HTML y no funciona en un `<img src>`. Hay que transformarlo:

| Formato | URL | Nota |
|---|---|---|
| Thumbnail | `drive.google.com/thumbnail?id=<ID>&sz=w800` | El más estable, permite pedir ancho |
| Directo | `lh3.googleusercontent.com/d/<ID>=w800` | Rápido, endpoint no documentado |

**Riesgos:** ninguno de los dos es API oficial y Google los ha cambiado sin aviso; usar Drive como hosting viola sus ToS y arriesga la cuenta entera del vendedor, no solo las URLs; hay throttling; no se controla caché ni formato; el archivo debe estar compartido como "cualquiera con el link".

**Mitigación.** En `Product.imageUrl` se guarda el link tal cual lo pega el admin. Un `ImageUrlResolver` en infraestructura detecta si es un link de Drive y lo normaliza al formato thumbnail. En el frontend, `ImageWithFallback` muestra un placeholder si la imagen falla. Migrar a Cloudinary, S3 o disco local supone tocar **dos archivos**, sin cambios en la base de datos ni en los componentes. Al haber tracción real, la migración se ejecuta — no se pospone indefinidamente.

---

## 6. Mensaje de WhatsApp

```
🛒 *Nuevo pedido - NPCart*
🧾 *Código: NPC-8F3K*

*Mini mediana (3-4 cm)*
• Spiderman Clásico — 2 x S/ 12.00
• Beholder D&D — 3 x S/ 12.00
  🎁 Oferta 5+: S/ 12 c/u  (ahorras S/ 15.00)

*Mini grande (4-5 cm)*
• Dragón Rojo — 1 x S/ 25.00

Ahorro total: S/ 15.00
*Total: S/ 85.00*
```

Agrupado por tamaño para que el ahorro sea legible. El **código de pedido** permite al vendedor verificar totales contra el panel admin. Generado con `encodeURIComponent` sobre `https://wa.me/51XXXXXXXXX?text=...`; el número se configura en el `.env` del frontend. Cada línea usa la serie principal del producto.

**Mensaje largo.** Si el texto supera ~1800 caracteres, las líneas restantes se colapsan en `…y N ítems más`; los totales y el ahorro van siempre completos. El link nunca se trunca silenciosamente.

---

## 7. Fases de implementación

| # | Fase | Entregable |
|---|---|---|
| 1 | Scaffolding | Monorepo con workspaces (root + `packages/pricing`), Vite+Tailwind, Express+TS, ESLint/Prettier, `.env.example`, `docker-compose` con Postgres (dev), READMEs |
| 2 | Dominio backend | Entidades, value objects, **`packages/pricing`** (regla de ofertas + tests unitarios, sin BD) |
| 3 | Infraestructura | Schema Prisma (deletedAt, índices parciales, Order/OrderItem), migración, repositorios, seed idempotente: tamaños, series, minis demo y admin desde `.env` |
| 4 | API | Casos de uso, controllers, validación zod, `errorHandler`, JWT, **CORS con allowlist**, facetas, GETs admin, paginación |
| 5 | Base frontend | Capas, gateways, TanStack Query, stores, router, resolver de imágenes de Drive, carrito versionado |
| 6 | Catálogo | Home con series, grid, filtros facetados, detalle de producto |
| 7 | Carrito + WhatsApp | Drawer, cálculo de ofertas, barra de progreso, `POST /api/orders` con reconciliación y código, generación del link |
| 8 | Panel admin | Login, CRUD completo, archivado/restaurar, toggles, multi-select de series, preview de imagen, **página de pedidos** (confirmar/cancelar con stock) |
| 9 | Pulido | Responsive, accesibilidad, estados vacíos y de error, **anti-indexación** (robots.txt, noindex, X-Robots-Tag), build de producción |
| 10 | Despliegue | Railway y Netlify configurados, migraciones en pipeline, backup documentado, verificación end-to-end |

---

## 8. Despliegue y operación

- **Railway** — backend + Postgres (plugin). Deploy command: `npx prisma migrate deploy && npm run seed` (seed idempotente: solo crea el admin si no existe). Variables: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_ORIGINS`.
- **Netlify** — frontend estático con `_redirects` para SPA fallback. Variables: `VITE_API_URL`, `VITE_WHATSAPP_NUMBER`.
- **Monorepo:** ambos servicios se configuran desde la raíz del repo para que npm workspaces resuelva `@npcart/pricing` (Railway: root directory `backend`; Netlify: base `frontend`).
- **CORS** obligatorio (orígenes distintos): allowlist con el dominio de Netlify y el custom domain.
- **Backups:** Railway no respalda el Postgres del plugin automáticamente → `pg_dump` manual documentado con frecuencia fija.
- **Anti-indexación:** `robots.txt` (disallow all), `<meta name="robots" content="noindex">` y header `X-Robots-Tag: noindex` desde el backend. La distribución es por WhatsApp a clientes recurrentes; la web no debe aparecer en buscadores (contenido de impresión 3D con posible IP de terceros).

---

## 9. Riesgos vigilados

- **URLs de Google Drive no oficiales.** Aisladas en `ImageUrlResolver` + `ImageWithFallback` con placeholder. Migración barata; se ejecuta al haber tracción (ToS de Drive).
- **Regla de ofertas.** Una sola implementación en `packages/pricing` compartida por front y back, con un único set de tests. No puede divergir.
- **Precisión en dinero.** Céntimos enteros de punta a punta (Int en BD, enteros en dominio y DTOs, formateo solo en presentación). Nunca `float` ni `Decimal` cruzando la API.
- **Stock sin reserva.** Dos clientes pueden pedir la última unidad; el carrito nunca reserva. El conflicto aparece al confirmar el pedido en el panel, donde el vendedor lo ve antes de aceptar. Aceptable: la venta se cierra en la conversación de WhatsApp.
- **Mensaje de WhatsApp como único registro (mitigado).** El snapshot `Order` persiste totales e ítems verificados por el servidor; el código en el mensaje permite validar cualquier pedido contra el panel.
