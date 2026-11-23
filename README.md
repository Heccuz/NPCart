# NPCart

Catálogo web de minis impresas en 3D con carrito y pedido confirmado por WhatsApp.
Pedido persistido como snapshot verificable (`Order` + código corto), sin cuentas de cliente.

## Estructura

```
frontend/          React + Vite + Tailwind (clean architecture)
backend/           Express + Prisma (clean architecture)
packages/pricing/  Regla de ofertas compartida (una sola implementación + tests)
```

Monorepo con **npm workspaces**: un solo `npm install` en la raíz, un solo lockfile.

## Quickstart (desarrollo)

```bash
npm install                  # instala los tres workspaces
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:up                # Postgres en Docker (localhost:5432)
npm run db:migrate -w backend
npm run db:seed              # datos demo + admin desde .env
npm run dev                  # API :4000 + web :5173
```

- API: http://localhost:4000/health
- Web: http://localhost:5173
- Admin: http://localhost:5173/admin (credenciales de `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | API y web en paralelo |
| `npm test` | Tests de precios y del mensaje de WhatsApp |
| `npm run typecheck` | Typecheck de los tres workspaces |
| `npm run build` | Build de producción del frontend + typecheck del backend |
| `npm run db:up` / `db:migrate` / `db:seed` | Postgres local, migraciones y seed |
| `npm run db:backup` | `pg_dump` a `backups/` (requiere `DATABASE_URL`) |
| `npm run create-admin -w backend` | Crea/resetea el admin desde variables de entorno |

## Dinero

Todo precio vive y viaja como **céntimos enteros** (`1250` = S/ 12.50).
El formateo a soles ocurre solo en la interfaz (`Intl.NumberFormat('es-PE')`).

## Borrado

La API nunca borra filas: `DELETE` archiva (`deletedAt`) y el panel admin permite restaurar.
Los slugs se liberan al archivar gracias a índices únicos parciales.

## Despliegue

### Railway — backend + Postgres

1. Crear proyecto, añadir el plugin **PostgreSQL**.
2. Servicio desde este repo con **root directory = raíz del repo** (no `backend/`):
   npm workspaces necesita instalar `packages/pricing` desde la raíz.
3. `railway.toml` ya define build, migraciones, seed y healthcheck:
   - build: `npm ci && npm run db:generate -w backend`
   - start: `prisma migrate deploy` → seed (solo admin en producción) → API
   - healthcheck: `/health`
4. Variables del backend:

| Variable | Ejemplo |
|---|---|
| `DATABASE_URL` | la inyecta el plugin de Railway |
| `JWT_SECRET` | cadena aleatoria de 32+ caracteres |
| `JWT_EXPIRES_IN` | `12h` |
| `ADMIN_EMAIL` | `admin@tudominio.com` |
| `ADMIN_PASSWORD` | contraseña fuerte (reset = cambiarla y redeployar) |
| `FRONTEND_ORIGINS` | `https://tutienda.netlify.app,https://tudominio.com` |
| `NODE_ENV` | `production` |

> En producción el seed **no toca el catálogo**: solo garantiza el admin.
> Para poblar un entorno nuevo con datos demo: `SEED_DEMO=true`.

### Netlify — frontend

`netlify.toml` ya configura build (`npm run build -w frontend`), publish
(`frontend/dist`) y SPA fallback (`public/_redirects`).

Variables de entorno en Netlify:

| Variable | Ejemplo |
|---|---|
| `VITE_API_URL` | `https://npcart-api.up.railway.app` |
| `VITE_WHATSAPP_NUMBER` | `51987654321` (sin `+`, sin espacios) |

La API responde CORS solo a los orígenes de `FRONTEND_ORIGINS`: al añadir un
dominio propio, actualízala y redeploya Railway.

### Backups

Railway no respalda el plugin de Postgres automáticamente.

```bash
railway run bash backend/scripts/backup-db.sh        # crea backups/npcart-<fecha>.dump
pg_restore --clean --no-owner -d "$DATABASE_URL" backups/npcart-<fecha>.dump
```

Programar el `pg_dump` con la frecuencia que el negocio necesite y guardar los
archivos fuera del repo.

## Anti-indexación

La web distribuye por WhatsApp y no debe aparecer en buscadores:
`robots.txt` (disallow total), `<meta name="robots" content="noindex">`,
header `X-Robots-Tag` en API y en Netlify.

## Notas de desarrollo

- WSL sobre `/mnt/d` no emite eventos de filesystem: Vite activa polling solo
  cuando detecta `WSL_DISTRO_NAME`, para que el HMR funcione.
- La regla de ofertas vive una sola vez en `packages/pricing`; el backend y el
  frontend la importan. Cambiarla actualiza carrito, cotización y tests a la vez.
