#!/bin/bash
set -euo pipefail

S3_ENDPOINT="http://minio:9000"
S3_BUCKET="edgeucate-backups"
RESTORE_PATH="/tmp/restore-test.gz"

echo "=== MongoDB Backup Restore Test ==="

export AWS_ACCESS_KEY_ID="${MINIO_ROOT_USER}"
export AWS_SECRET_ACCESS_KEY="${MINIO_ROOT_PASSWORD}"

LATEST_BACKUP=$(aws s3 ls "s3://${S3_BUCKET}/daily/" \
    --endpoint-url "${S3_ENDPOINT}" 2>/dev/null \
    | awk '{print $4}' \
    | sort \
    | tail -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "No backups found in s3://${S3_BUCKET}/daily/"
    echo "Run a backup first: /usr/local/bin/backup.sh daily"
    exit 1
fi

echo "Found: ${LATEST_BACKUP}"

START_TIME=$(date +%s)
aws s3 cp "s3://${S3_BUCKET}/daily/${LATEST_BACKUP}" "${RESTORE_PATH}" \
    --endpoint-url "${S3_ENDPOINT}"
END_TIME=$(date +%s)
DOWNLOAD_TIME=$((END_TIME - START_TIME))

BACKUP_SIZE=$(du -h "${RESTORE_PATH}" | cut -f1)
echo "Downloaded: ${BACKUP_SIZE} in ${DOWNLOAD_TIME}s"

gunzip -t "${RESTORE_PATH}" && echo "Archive integrity: OK" || {
    echo "Archive integrity: FAILED"
    rm -f "${RESTORE_PATH}"
    exit 1
}

rm -f "${RESTORE_PATH}"

echo "Backup integrity verified"
echo "File: ${LATEST_BACKUP}"
echo "Size: ${BACKUP_SIZE}"
echo "Download time: ${DOWNLOAD_TIME}s"
exit 0