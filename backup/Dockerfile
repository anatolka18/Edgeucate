FROM mongo:7.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    cron \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip

RUN curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc \
    && chmod +x /usr/local/bin/mc

COPY backup.sh /usr/local/bin/backup.sh
COPY test-restore.sh /usr/local/bin/test-restore.sh
COPY init-minio.sh /usr/local/bin/init-minio.sh

RUN printf "# MongoDB Backup Schedule\n" > /etc/cron.d/backup && \
    printf "0 3 * * * root /usr/local/bin/backup.sh daily >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "0 4 * * 0 root /usr/local/bin/backup.sh weekly >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "0 5 1 * * root /usr/local/bin/backup.sh monthly >> /var/log/backup.log 2>&1\n" >> /etc/cron.d/backup && \
    printf "\n" >> /etc/cron.d/backup

RUN chmod +x /usr/local/bin/backup.sh && \
    chmod +x /usr/local/bin/test-restore.sh && \
    chmod +x /usr/local/bin/init-minio.sh && \
    chmod 0644 /etc/cron.d/backup && \
    touch /var/log/backup.log && \
    touch /var/log/cron.log && \
    crontab /etc/cron.d/backup

CMD ["cron", "-f"]