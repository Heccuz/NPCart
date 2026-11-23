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
- Admin: http://localhost:5173/admin

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | API y web en paralelo |
| `npm test` | Tests de la regla de ofertas |
| `npm run typecheck` | Typecheck de los tres workspaces |
| `npm run build` | Build de producción del frontend + typecheck del backend |
| `npm run db:up` / `db:migrate` / `db:seed` | Postgres local, migraciones y seed |
| `npm run create-admin -w backend` | Crea/resetea el admin desde variables de entorno |

## Dinero

Todo precio vive y viaja como **céntimos enteros** (`1250` = S/ 12.50).
El formateo a soles ocurre solo en la interfaz (`Intl.NumberFormat('es-PE')`).

## Borrado

La API nunca borra filas: `DELETE` archiva (`deletedAt`) y el panel admin permite restaurar.

## Despliegue

Ver [PLAN.md](PLAN.md) §8. Backend + Postgres en Railway, frontend en Netlify.
