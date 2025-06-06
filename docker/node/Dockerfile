FROM node
COPY ssh_host_ed25519_key.pub /etc/ssh/
COPY --chmod=0600 ssh_host_ed25519_key /etc/ssh/
RUN echo 'TERM=xterm-256color' >> /etc/environment && \
	apk update && apk upgrade && apk add xauth && apk add openssh && \
	apk add firefox-esr && \
	echo "X11UseLocalhost no" >> /etc/ssh/sshd_config && \
	mkdir /var/run/sshd
CMD ["/usr/sbin/sshd", "-D"]
