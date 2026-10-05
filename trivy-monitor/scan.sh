#!/bin/bash
set -uo pipefail

exec 9>/var/lock/trivy-monitor.lock
flock -n 9 || { echo "Another scan is running, exit"; exit 0; }

REGISTRY="ghcr.io/anatolka18/edgeucate"
IMAGES="server client mongo-backup"
OUT=/opt/trivy-monitor
mkdir -p "$OUT/reports"

for img in $IMAGES; do
  echo "=== $(date -Is) scanning $img ==="
  rm -f "$OUT/reports/${img}.json"
  docker save "${REGISTRY}/${img}:latest" -o "/tmp/trivy-${img}.tar" || { echo "docker save failed: $img"; continue; }
  nice -n 19 ionice -c3 trivy image --input "/tmp/trivy-${img}.tar" \
    --format json --quiet --scanners vuln \
    -o "$OUT/reports/${img}.json" || echo "trivy failed: $img"
  rm -f "/tmp/trivy-${img}.tar"
done

python3 /home/deploy/Edgeucate/trivy-monitor/parse.py
curl -sf -X PUT --data-binary @"$OUT/metrics.prom" \
  http://127.0.0.1:9091/metrics/job/trivy \
  && echo "Metrics pushed to Pushgateway"