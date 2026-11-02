#!/usr/bin/env bash
# =========================================================================
# Hospital del Computador - Script de Restauración Controlada (PostgreSQL)
# Archivo: scripts/restore_production.sh
# Uso manual e interactivo para Disaster Recovery
# =========================================================================

set -eo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -z "$1" ]; then
    echo "Uso: $0 <ruta_al_archivo_dump>"
    echo "Ejemplo: $0 ./backups/hdc_prod_20261102_020000.dump"
    exit 1
fi

DUMP_FILE="$1"

if [ ! -f "${DUMP_FILE}" ]; then
    echo "❌ ERROR: El archivo de volcado no existe: ${DUMP_FILE}"
    exit 1
fi

if [ -f "${APP_DIR}/.env" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "${APP_DIR}/.env" | xargs -d '\n')
else
    echo "❌ ERROR: No se encontró el archivo .env"
    exit 1
fi

DB_USER="${DB_USER:-hdc_prod_user}"
DB_NAME="${DB_DATABASE:-hdc_prod}"

echo "========================================================================="
echo "   ADVERTENCIA: PROTOCOLO DE RESTAURACIÓN DE BASE DE DATOS PRODUCTIVA"
echo "========================================================================="
echo "Target Base de Datos : ${DB_NAME}"
echo "Usuario PostgreSQL   : ${DB_USER}"
echo "Archivo a Restaurar  : ${DUMP_FILE}"
echo ""
echo "Esta operación reiniciará la base '${DB_NAME}' y cargará los datos del volcado."
read -p "¿Está seguro de continuar? Escriba 'CONFIRMAR-RESTAURAR': " CONFIRMATION

if [ "${CONFIRMATION}" != "CONFIRMAR-RESTAURAR" ]; then
    echo "Operación cancelada por el operador."
    exit 0
fi

echo ""
echo "1. Deteniendo frontend y backend para evitar transacciones concurrentes..."
docker compose -f "${APP_DIR}/compose.yaml" stop backend frontend

echo "2. Recreando la base de datos limpia..."
docker compose -f "${APP_DIR}/compose.yaml" exec -T postgres \
    psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE);"

docker compose -f "${APP_DIR}/compose.yaml" exec -T postgres \
    psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME} WITH ENCODING 'UTF8';"

echo "3. Restaurando volcado binario mediante pg_restore..."
docker compose -f "${APP_DIR}/compose.yaml" exec -T postgres \
    pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists -v < "${DUMP_FILE}" || true

echo "4. Reactivando servicios backend y frontend..."
docker compose -f "${APP_DIR}/compose.yaml" start backend frontend

echo ""
echo "5. Verificando estado de salud de los servicios..."
sleep 10
docker compose -f "${APP_DIR}/compose.yaml" ps

echo ""
echo "✅ Restauración completada. Se recomienda ejecutar la reconciliación con Cloudflare R2:"
echo "   docker compose run --rm backend node test/reconciliar-r2-db.js"

