#!/usr/bin/env bash
# Backup manual de PostgreSQL (Railway no respalda el plugin automáticamente).
# Uso local:      DATABASE_URL="postgresql://…" bash backend/scripts/backup-db.sh
# Uso contra prod: railway run bash backend/scripts/backup-db.sh
set -euo pipefail

: "${DATABASE_URL:?Define DATABASE_URL (o ejecuta con 'railway run')}"

mkdir -p backups
file="backups/npcart-$(date +%Y%m%d-%H%M%S).dump"
pg_dump "$DATABASE_URL" --format=custom --no-owner --file="$file"
echo "Backup creado: $file"
echo "Restaurar con: pg_restore --clean --no-owner -d \"\$DATABASE_URL\" $file"
