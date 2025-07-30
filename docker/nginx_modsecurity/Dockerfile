FROM owasp/modsecurity-crs:nginx

USER root

RUN apt-get update && apt-get upgrade -y; \
	apt-get install -y mc nano curl; \
	rm -rf /var/lib/apt/lists/*;

RUN mkdir -p /etc/nginx/ssl
# Копируем свои самоподписанные сертификаты
# COPY --chmod=0644 ./ssl/front.crt /etc/nginx/ssl/front.crt
# COPY --chmod=0600 ./ssl/front.key /etc/nginx/ssl/front.key
COPY ./ssl/front.crt /etc/nginx/ssl/front.crt
COPY ./ssl/front.key /etc/nginx/ssl/front.key
# Копируем свои конфиги (если нужно)
COPY ./modsecurity.conf /opt/conf/modsecurity.conf
COPY ./crs-setup.conf /opt/conf/crs-setup.conf
# COPY ./modsecurity.conf /etc/modsecurity.d/modsecurity.conf
# COPY ./crs-setup.conf /etc/modsecurity.d/crs-setup.conf

# Устанавливаем владельца — пользователь 101 (по умолчанию Nginx работает от него)
RUN chown 101:0 /etc/nginx/ssl/front.crt /etc/nginx/ssl/front.key \
 && chmod 644 /etc/nginx/ssl/front.crt \
 && chmod 600 /etc/nginx/ssl/front.key
RUN chown 101:0 /opt/conf/*.conf && chmod 640 /opt/conf/*.conf

COPY ./rules/rules /etc/modsecurity.d/rules

RUN mkdir -p /var/log/modsec \
 && touch /var/log/modsec/audit.log /var/log/modsec/error.log \
 && chown nginx:nginx /var/log/modsec/*.log \
 && chmod 644 /var/log/modsec/*.log

COPY --chown=root:root default.conf.template /etc/nginx/templates/conf.d/default.conf.template
ENV CUSTOM_LOCATION_BLOCK="location = /api/auth/google/callback { modsecurity_rules \"SecRuleRemoveById 930120\"; include includes/cors.conf; include includes/proxy_backend.conf; }"



# RUN find /var/log/modsec -name '*.log' -exec chown nginx:nginx {} \; \
#  && find /var/log/modsec -name '*.log' -exec chmod 644 {} \;
# RUN chown nginx:nginx /var/log/modsec/*.log \
#  && chmod 644 /var/log/modsec/*.log

# Устанавливаем переменные окружения — будут обработаны при запуске контейнера
# ENV \
#   PORT=8080 \
#   SSL_PORT=8443 \
#   SERVER_NAME=localhost \
#   SERVER_TOKENS=off \
#   NGINX_ALWAYS_TLS_REDIRECT=on \
#   SSL_CERT=/etc/nginx/ssl/front.crt \
#   SSL_CERT_KEY=/etc/nginx/ssl/front.key \
#   SSL_PROTOCOLS="TLSv1.2 TLSv1.3" \
#   SSL_CIPHERS="HIGH:!aNULL:!MD5" \
#   SSL_PREFER_CIPHERS=on \
#   SSL_VERIFY=off \
#   SSL_VERIFY_DEPTH=1 \
#   PROXY_PASS=https://node_sqlite:12800 \
#   PROXY_SSL_PROTOCOLS="TLSv1.2 TLSv1.3" \
#   PROXY_SSL_CIPHERS="HIGH:!aNULL:!MD5" \
#   PROXY_SSL_VERIFY=off

USER 101

# FROM owasp/modsecurity-crs:nginx

# USER root

# RUN apt-get update && apt-get upgrade -y; \
# 	apt-get install -y mc nano; \
# 	rm -rf /var/lib/apt/lists/*;
# # RUN mr -f /etc/nginx/nginx.conf
# COPY nginx.conf /etc/nginx/nginx.conf
# COPY ssl/ /etc/nginx/ssl/
# COPY modsecurity/modsecurity.conf /etc/modsecurity/modsecurity.conf
# COPY modsecurity/crs-setup.conf /etc/modsecurity/rules/crs-setup.conf
# COPY modsecurity/rules/ /etc/modsecurity/rules/rules/

# USER nginx