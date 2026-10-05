#!/bin/bash
set -euo pipefail

S3_ENDPOINT="http://minio:9000"
S3_BUCKET="edgeucate-backups"
S3_REGION="us-east-1"
RESTORE_PATH="/tmp/restore-test.gz"

echo "=== MongoDB Backup Restore Test ==="

SIGV4="aws:amz:${S3_REGION}:s3"

LIST=$(curl -sS --fail \
    --aws-sigv4 "$SIGV4" \
    --user "${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}" \
    "${S3_ENDPOINT}/${S3_BUCKET}?list-type=2&prefix=daily/")

LATEST_BACKUP=$(echo "$LIST" | grep -oP '(?<=<Key>)daily/[^<]+\.gz' | sort | tail -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "No backups found in daily/"
    exit 1
fi

echo "Found: ${LATEST_BACKUP}"

START_TIME=$(date +%s)
curl -sS --fail \
    --aws-sigv4 "$SIGV4" \
    --user "${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}" \
    -o "${RESTORE_PATH}" \
    "${S3_ENDPOINT}/${S3_BUCKET}/${LATEST_BACKUP}"
END_TIME=$(date +%s)

BACKUP_SIZE=$(du -h "${RESTORE_PATH}" | cut -f1)
echo "Downloaded: ${BACKUP_SIZE} in $((END_TIME - START_TIME))s"

gunzip -t "${RESTORE_PATH}" && echo "Archive integrity: OK" || {
    echo "Archive integrity: FAILED"; rm -f "${RESTORE_PATH}"; exit 1;
}

rm -f "${RESTORE_PATH}"
echo "Backup integrity verified"
exit 0