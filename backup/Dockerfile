FROM mongo:8.0

ARG DEBIAN_FRONTEND=noninteractive

RUN sed -i 's|http://archive.ubuntu.com/ubuntu|http://azure.archive.ubuntu.com/ubuntu http://archive.ubuntu.com/ubuntu|g' /etc/apt/sources.list.d/ubuntu.sources \
    && printf 'Acquire::ForceIPv4 "true";\nAcquire::Retries "3";\nAcquire::http::Timeout "20";\nAcquire::https::Timeout "20";\n' > /etc/apt/apt.conf.d/99ci-network

ARG CACHE_BUST=1
RUN apt-get update \
    && apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" \
    && apt-get install -y --no-install-recommends \
    curl cron ca-certificates file util-linux \
    && rm -rf /var/lib/apt/lists/*

RUN cd /opt && \
    rm -rf js-yaml && \
    mkdir js-yaml && \
    curl -4 -fsSL --connect-timeout 15 --max-time 120 https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.2.tgz \
        | tar -xz --strip-components=1 -C js-yaml

RUN rm -f /usr/local/bin/gosu

RUN groupadd -r -g 1001 backupuser && useradd -r -u 1001 -g 1001 -m backupuser

COPY backup.sh /usr/local/bin/backup.sh
COPY test-restore.sh /usr/local/bin/test-restore.sh
COPY init-minio.sh /usr/local/bin/init-minio.sh

RUN printf "# MongoDB Backup Schedule\n" > /etc/cron.d/backup && \
    printf "0 3 * * * root setpriv --reuid=1001 --regid=1001 --init-groups /usr/local/bin/backup.sh daily >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "0 4 * * 0 root setpriv --reuid=1001 --regid=1001 --init-groups /usr/local/bin/backup.sh weekly >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "0 5 1 * * root setpriv --reuid=1001 --regid=1001 --init-groups /usr/local/bin/backup.sh monthly >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    chmod 0644 /etc/cron.d/backup

RUN chmod +x /usr/local/bin/*.sh && \
    touch /var/log/backup.log /var/log/cron.log && \
    chown 1001:1001 /var/log/backup.log

CMD ["cron", "-f"]