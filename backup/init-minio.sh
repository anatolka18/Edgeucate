#!/bin/bash
set -euo pipefail

echo "Waiting for MinIO..."
until curl -s http://minio:9000/minio/health/live > /dev/null; do
    sleep 5
done
echo "MinIO is ready"

mc alias set local http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

if ! mc ls local/edgeucate-backups > /dev/null 2>&1; then
    mc mb local/edgeucate-backups
    echo "Bucket created: edgeucate-backups"
else
    echo "Bucket exists: edgeucate-backups"
fi

mc ilm rule rm --all --force local/edgeucate-backups 2>/dev/null || true
echo "Cleared existing lifecycle rules"

mc ilm rule add local/edgeucate-backups --prefix "daily/" --expire-days 7
mc ilm rule add local/edgeucate-backups --prefix "weekly/" --expire-days 28
mc ilm rule add local/edgeucate-backups --prefix "monthly/" --expire-days 365

echo "Lifecycle rules configured:"
mc ilm rule ls local/edgeucate-backups