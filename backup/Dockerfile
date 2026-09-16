FROM golang:1.23-bookworm AS mc-builder

ENV MC_VERSION=RELEASE.2024-09-16T17-43-14Z

RUN set -ex \
    && apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && git clone --depth 1 --branch ${MC_VERSION} https://github.com/minio/mc.git /build/mc \
    && cd /build/mc \
    && go build -o /usr/local/bin/mc

FROM mongo:8.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    cron \
    ca-certificates \
    gosu \
    file \
    && rm -rf /var/lib/apt/lists/*

RUN set -ex \
    && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip \
    && aws --version

COPY --from=mc-builder /usr/local/bin/mc /usr/local/bin/mc
RUN chmod +x /usr/local/bin/mc \
    && file /usr/local/bin/mc | grep -q "ELF 64-bit" \
    && mc --version

RUN groupadd -r backupuser && useradd -r -g backupuser -m backupuser

COPY backup.sh /usr/local/bin/backup.sh
COPY test-restore.sh /usr/local/bin/test-restore.sh
COPY init-minio.sh /usr/local/bin/init-minio.sh

RUN printf "# MongoDB Backup Schedule\n" > /etc/cron.d/backup && \
    printf "0 3 * * * root gosu backupuser /usr/local/bin/backup.sh daily >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "0 4 * * 0 root gosu backupuser /usr/local/bin/backup.sh weekly >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "0 5 1 * * root gosu backupuser /usr/local/bin/backup.sh monthly >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    chmod 0644 /etc/cron.d/backup && \
    crontab /etc/cron.d/backup

RUN chmod +x /usr/local/bin/*.sh && \
    touch /var/log/backup.log /var/log/cron.log && \
    chown backupuser:backupuser /var/log/backup.log

CMD ["cron", "-f"]