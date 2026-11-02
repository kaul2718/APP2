#!/usr/bin/env bash
# =========================================================================
# Hospital del Computador - Script Automatizado de Respaldo Lógico (PostgreSQL)
# Archivo: scripts/backup_production.sh
# Diseñado para ejecución desatendida vía Cron en Ubuntu 24.04 LTS
# =========================================================================

set -eo pipefail

# Directorio base del proyecto
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/hdc_prod_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "=== INICIO DE RESPALDO DE BASE DE DATOS ==="

# 1. Cargar variables de entorno desde .env
if [ -f "${APP_DIR}/.env" ]; then
    # shellcheck disable=SC2046
    export $(grep -v '^#' "${APP_DIR}/.env" | xargs -d '\n')
else
    log "❌ ERROR: No se encontró el archivo .env en ${APP_DIR}"
    exit 1
fi

DB_USER="${DB_USER:-hdc_prod_user}"
DB_NAME="${DB_DATABASE:-hdc_prod}"

# 2. Ejecutar pg_dump dentro del contenedor de PostgreSQL en formato Custom (-Fc)
log "Generando volcado de la base '${DB_NAME}'..."

if docker compose -f "${APP_DIR}/compose.yaml" exec -T postgres \
    pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc --no-owner --no-privileges \
    > "${BACKUP_FILE}"; then
    
    FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
    log "✅ Respaldo local creado exitosamente: ${BACKUP_FILE} (${FILE_SIZE})"
else
    log "❌ ERROR: Falló la ejecución de pg_dump en el contenedor postgres."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# 3. Validación de tamaño mínimo (para evitar guardar archivos vacíos de 0 bytes)
MIN_BYTES=1024
ACTUAL_BYTES="$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo 0)"

if [ "${ACTUAL_BYTES}" -lt "${MIN_BYTES}" ]; then
    log "❌ ERROR: El archivo de respaldo es sospechosamente pequeño (${ACTUAL_BYTES} bytes). Abortando."
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# 4. Sincronización a almacenamiento externo fuera del VPS (Cloudflare R2 / AWS S3)
if [ -n "${R2_ENDPOINT}" ] && [ -n "${R2_ACCESS_KEY_ID}" ] && [ -n "${R2_SECRET_ACCESS_KEY}" ]; then
    log "Copiando respaldo a almacenamiento secundario R2..."
    export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
    export AWS_DEFAULT_REGION="auto"

    R2_BACKUP_PATH="s3://${R2_BUCKET_NAME:-hospital-computador-prod}/backups/database/$(basename "${BACKUP_FILE}")"

    if aws s3 cp "${BACKUP_FILE}" "${R2_BACKUP_PATH}" --endpoint-url "${R2_ENDPOINT}" >> "${LOG_FILE}" 2>&1; then
        log "✅ Respaldo transferido exitosamente a: ${R2_BACKUP_PATH}"
    else
        log "⚠️ ADVERTENCIA: No se pudo subir a Cloudflare R2. El archivo persiste localmente en ${BACKUP_FILE}."
    fi
else
    log "ℹ Cloudflare R2 no configurado para respaldos externos. Respaldo conservado localmente."
fi

# 5. Rotación de respaldos locales (conservar últimos 7 días)
log "Limpiando respaldos locales con más de 7 días de antigüedad..."
find "${BACKUP_DIR}" -name "hdc_prod_*.dump" -mtime +7 -delete

log "=== PROCESO DE RESPALDO FINALIZADO EXITOSAMENTE ==="
exit 0

