FROM alpine
# FROM debian
COPY ssh_host_ed25519_key.pub /etc/ssh/
COPY --chmod=0600 ssh_host_ed25519_key /etc/ssh/
RUN /usr/sbin/adduser -s /bin/bash -h /home/node -S -D -u 1000 node;
COPY --chmod=777 run.sh /home/node/
RUN apk update && apk upgrade; \
    apk --no-cache add bash mc; \
    apk --no-cache add openssh && mkdir /var/run/sshd && echo 'TERM=xterm-256color' >> /etc/environment; \
    apk --no-cache add openrc; \
    rc-status; \
    rc-update add sshd; \
    touch /run/openrc/softlevel; \
    apk --no-cache add nodejs npm; \
	apk --no-cache add sqlite
