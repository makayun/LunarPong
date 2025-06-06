FROM alpine:3.20
RUN     apk update && apk upgrade && apk add --no-cache mariadb mariadb-client && \
        mkdir -p /var/run/mysqld && \
        chmod 777 /var/run/mysqld; \
        sed -i "s|skip-networking|skip-networking=0|g" /etc/my.cnf.d/mariadb-server.cnf; \
                mysql_install_db --datadir='/var/lib/mysql' --user=mysql && \
                chown -R mysql:mysql /var/lib/mysql
COPY    --chmod=777 db.sh /tmp/
COPY    --chmod=444 docker.cnf /etc/my.cnf.d/
USER mysql
ENTRYPOINT  ["sh", "/tmp/db.sh"]
