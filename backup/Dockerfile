FROM mongo:8.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl cron ca-certificates file util-linux nodejs npm \
    && rm -rf /var/lib/apt/lists/*

RUN cd /opt && \
    rm -rf js-yaml && \
    mkdir js-yaml && \
    curl -fsSL https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.2.tgz \
        | tar -xz --strip-components=1 -C js-yaml

RUN apt-get purge -y nodejs npm && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /root/.npm

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