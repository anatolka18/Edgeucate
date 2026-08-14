#!/bin/bash

if [ -f /proc/1/environ ]; then
    set -a
    while IFS='=' read -r -d '' name value; do
        export "$name"="$value"
    done < /proc/1/environ
    set +a
fi

set -euo pipefail

BACKUP_TYPE="${1:-daily}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="edgeucate-${BACKUP_TYPE}-${TIMESTAMP}.gz"
BACKUP_PATH="/tmp/${BACKUP_NAME}"
BACKUP_PATH_RAW="/tmp/${BACKUP_NAME}.raw"

S3_ENDPOINT="http://minio:9000"
S3_BUCKET="edgeucate-backups"
S3_PATH="s3://${S3_BUCKET}/${BACKUP_TYPE}/${BACKUP_NAME}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$1] $2"
}

log "INFO" "Starting ${BACKUP_TYPE} backup"

if ! mongodump --uri="${MONGODB_URI}" --archive="${BACKUP_PATH_RAW}" 2>&1 | tail -5; then
    log "ERROR" "mongodump failed"
    rm -f "${BACKUP_PATH_RAW}" "${BACKUP_PATH}"
    exit 1
fi

gzip -c "${BACKUP_PATH_RAW}" > "${BACKUP_PATH}"
rm -f "${BACKUP_PATH_RAW}"

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log "INFO" "Compressed size: ${BACKUP_SIZE}"

export AWS_ACCESS_KEY_ID="${MINIO_ROOT_USER}"
export AWS_SECRET_ACCESS_KEY="${MINIO_ROOT_PASSWORD}"

if ! aws s3 cp "${BACKUP_PATH}" "${S3_PATH}" \
    --endpoint-url "${S3_ENDPOINT}" \
    --storage-class STANDARD 2>&1; then
    log "ERROR" "Upload to MinIO failed"
    rm -f "${BACKUP_PATH}"
    exit 1
fi

rm -f "${BACKUP_PATH}"
log "INFO" "Backup completed: ${BACKUP_NAME} (${BACKUP_SIZE})"
exit 0