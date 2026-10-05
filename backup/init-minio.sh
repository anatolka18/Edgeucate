#!/bin/bash
set -uo pipefail

S3_ENDPOINT="http://minio:9000"
S3_REGION="us-east-1"
SIGV4="aws:amz:${S3_REGION}:s3"
AUTH="${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$1] $2"; }

log "INFO" "Waiting for MinIO..."
until curl -s http://minio:9000/minio/health/live > /dev/null; do sleep 5; done
log "INFO" "MinIO is ready"

for BUCKET in edgeucate-backups edgeucate-avatars; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
        --aws-sigv4 "$SIGV4" --user "$AUTH" \
        "${S3_ENDPOINT}/${BUCKET}")
    if [ "$HTTP_CODE" = "200" ]; then
        log "INFO" "Bucket created: ${BUCKET}"
    elif [ "$HTTP_CODE" = "409" ]; then
        log "INFO" "Bucket exists: ${BUCKET}"
    else
        log "ERROR" "Failed to create bucket ${BUCKET}, HTTP ${HTTP_CODE}"
        exit 1
    fi
done

LIFECYCLE_XML='<?xml version="1.0" encoding="UTF-8"?>
<LifecycleConfiguration>
  <Rule><ID>daily</ID><Filter><Prefix>daily/</Prefix></Filter><Status>Enabled</Status><Expiration><Days>7</Days></Expiration></Rule>
  <Rule><ID>weekly</ID><Filter><Prefix>weekly/</Prefix></Filter><Status>Enabled</Status><Expiration><Days>28</Days></Expiration></Rule>
  <Rule><ID>monthly</ID><Filter><Prefix>monthly/</Prefix></Filter><Status>Enabled</Status><Expiration><Days>365</Days></Expiration></Rule>
</LifecycleConfiguration>'

CONTENT_MD5=$(printf "%s" "$LIFECYCLE_XML" | openssl md5 -binary | base64)

log "INFO" "Setting lifecycle rules (MD5: ${CONTENT_MD5})"
HTTP_CODE=$(curl -s -o /tmp/lifecycle-response.xml -w "%{http_code}" -X PUT \
    --aws-sigv4 "$SIGV4" --user "$AUTH" \
    -H "Content-Type: application/xml" \
    -H "Content-MD5: ${CONTENT_MD5}" \
    -d "$LIFECYCLE_XML" \
    "${S3_ENDPOINT}/edgeucate-backups?lifecycle")

if [ "$HTTP_CODE" != "200" ]; then
    log "ERROR" "Lifecycle failed with HTTP ${HTTP_CODE}:"
    cat /tmp/lifecycle-response.xml
    exit 1
fi
log "INFO" "Lifecycle rules configured"

POLICY_XML='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::edgeucate-avatars/*"]}]}'

log "INFO" "Setting avatars policy"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    --aws-sigv4 "$SIGV4" --user "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$POLICY_XML" \
    "${S3_ENDPOINT}/edgeucate-avatars?policy")

if [ "$HTTP_CODE" != "204" ] && [ "$HTTP_CODE" != "200" ]; then
    log "ERROR" "Policy failed with HTTP ${HTTP_CODE}"
    exit 1
fi
log "INFO" "Avatars bucket set to public read"

log "INFO" "MinIO initialized successfully"
exit 0